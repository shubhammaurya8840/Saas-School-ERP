import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto } from "./dto/update-book.dto";
import { IssueBookDto } from "./dto/issue-book.dto";
import { ReturnBookDto } from "./dto/return-book.dto";
import { RenewBookDto } from "./dto/renew-book.dto";
import { UpdateLibrarySettingsDto } from "./dto/library-settings.dto";
import { AdjustFineDto } from "./dto/adjust-fine.dto";
import { QueryBooksDto, QueryIssuesDto } from "./dto/query-library.dto";
import {
  BookCopyStatus,
  BookIssueStatus,
  BorrowerType,
  UserRole,
  Prisma,
} from "@prisma/client";

@Injectable()
export class LibraryService {
  private readonly logger = new Logger(LibraryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  // =========================================================================
  // 1. MODULE ENTITLEMENT & TENANT VALIDATION
  // =========================================================================

  async assertLibraryModuleEnabled(schoolId: string) {
    const mod = await this.prisma.schoolModule.findUnique({
      where: { schoolId_moduleKey: { schoolId, moduleKey: "library" } },
    });
    if (mod && !mod.isEnabled) {
      throw new ForbiddenException("Library module is disabled for this school");
    }
  }

  // =========================================================================
  // 2. LIBRARY SETTINGS
  // =========================================================================

  async getSettings(schoolId: string) {
    await this.assertLibraryModuleEnabled(schoolId);

    let setting = await this.prisma.librarySetting.findUnique({
      where: { schoolId },
    });

    if (!setting) {
      setting = await this.prisma.librarySetting.create({
        data: {
          schoolId,
          defaultLoanDays: 14,
          maxBooksPerStudent: 3,
          maxBooksPerStaff: 5,
          finePerDay: 5.0,
          maxRenewals: 2,
        },
      });
    }

    return {
      ...setting,
      loanPeriodDays: setting.defaultLoanDays,
      renewalLimit: setting.maxRenewals,
      isFineEnabled: true,
    };
  }

  async updateSettings(
    schoolId: string,
    dto: UpdateLibrarySettingsDto,
    user: any,
    ipAddress?: string
  ) {
    await this.assertLibraryModuleEnabled(schoolId);

    const loanDays = dto.defaultLoanDays ?? dto.loanPeriodDays;
    const renewals = dto.maxRenewals ?? dto.renewalLimit;

    const setting = await this.prisma.librarySetting.upsert({
      where: { schoolId },
      update: {
        ...(loanDays !== undefined && {
          defaultLoanDays: loanDays,
        }),
        ...(dto.maxBooksPerStudent !== undefined && {
          maxBooksPerStudent: dto.maxBooksPerStudent,
        }),
        ...(dto.maxBooksPerStaff !== undefined && {
          maxBooksPerStaff: dto.maxBooksPerStaff,
        }),
        ...(dto.finePerDay !== undefined && {
          finePerDay: new Prisma.Decimal(dto.finePerDay),
        }),
        ...(renewals !== undefined && {
          maxRenewals: renewals,
        }),
      },
      create: {
        schoolId,
        defaultLoanDays: loanDays ?? 14,
        maxBooksPerStudent: dto.maxBooksPerStudent ?? 3,
        maxBooksPerStaff: dto.maxBooksPerStaff ?? 5,
        finePerDay: new Prisma.Decimal(dto.finePerDay ?? 5.0),
        maxRenewals: renewals ?? 2,
      },
    });

    await this.audit.log({
      action: "LIBRARY_SETTINGS_UPDATED",
      entity: "LibrarySetting",
      entityId: setting.id,
      schoolId,
      userId: user.id,
      details: { settings: dto },
      ipAddress,
    });

    return {
      ...setting,
      loanPeriodDays: setting.defaultLoanDays,
      renewalLimit: setting.maxRenewals,
      isFineEnabled: true,
    };
  }

  // =========================================================================
  // 3. BOOK CATALOGUE MANAGEMENT
  // =========================================================================

  async createBook(
    schoolId: string,
    dto: CreateBookDto,
    user: any,
    ipAddress?: string
  ) {
    await this.assertLibraryModuleEnabled(schoolId);

    const normalizedIsbn = dto.isbn.trim();
    const copiesCount = dto.totalCopies ?? dto.initialCopies ?? 1;
    const shelfLoc = dto.shelfLocation?.trim() || dto.locationRack?.trim() || null;

    // Check duplicate ISBN in this school tenant
    const existing = await this.prisma.book.findUnique({
      where: { schoolId_isbn: { schoolId, isbn: normalizedIsbn } },
    });

    if (existing) {
      throw new ConflictException(
        `Book with ISBN '${normalizedIsbn}' already exists in this school catalogue.`
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      const book = await tx.book.create({
        data: {
          schoolId,
          isbn: normalizedIsbn,
          title: dto.title.trim(),
          author: dto.author.trim(),
          category: dto.category.trim(),
          publisher: dto.publisher?.trim() || null,
          edition: dto.edition?.trim() || null,
          shelfLocation: shelfLoc,
          description: dto.description?.trim() || null,
          totalCopies: copiesCount,
          availableCopies: copiesCount,
        },
      });

      // Automatically generate physical BookCopy entries
      const copiesData = [];
      for (let i = 1; i <= copiesCount; i++) {
        const copyNumStr = i.toString().padStart(3, "0");
        copiesData.push({
          schoolId,
          bookId: book.id,
          copyNumber: i,
          barcode: `LIB-${normalizedIsbn}-${copyNumStr}`,
          status: BookCopyStatus.AVAILABLE,
          condition: "NEW",
        });
      }

      await tx.bookCopy.createMany({
        data: copiesData,
      });

      await this.audit.log(
        {
          action: "BOOK_CREATED",
          entity: "Book",
          entityId: book.id,
          schoolId,
          userId: user.id,
          details: {
            title: book.title,
            isbn: book.isbn,
            totalCopies: book.totalCopies,
          },
          ipAddress,
        },
        tx
      );

      return await tx.book.findUnique({
        where: { id: book.id },
        include: { copies: true },
      });
    });
  }

  async updateBook(
    schoolId: string,
    id: string,
    dto: UpdateBookDto,
    user: any,
    ipAddress?: string
  ) {
    await this.assertLibraryModuleEnabled(schoolId);

    const book = await this.prisma.book.findFirst({
      where: { id, schoolId },
      include: { copies: true },
    });

    if (!book) {
      throw new NotFoundException("Book not found in this school catalogue.");
    }

    if (dto.isbn && dto.isbn.trim() !== book.isbn) {
      const existing = await this.prisma.book.findUnique({
        where: { schoolId_isbn: { schoolId, isbn: dto.isbn.trim() } },
      });
      if (existing) {
        throw new ConflictException(
          `Book with ISBN '${dto.isbn.trim()}' already exists.`
        );
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      let newTotalCopies = book.totalCopies;
      let newAvailableCopies = book.availableCopies;

      if (dto.totalCopies !== undefined && dto.totalCopies !== book.totalCopies) {
        const currentlyIssuedCount = book.totalCopies - book.availableCopies;
        if (dto.totalCopies < currentlyIssuedCount) {
          throw new BadRequestException(
            `Cannot reduce total copies to ${dto.totalCopies}. There are currently ${currentlyIssuedCount} copies on loan.`
          );
        }

        if (dto.totalCopies > book.totalCopies) {
          // Add new copies
          const copiesToAdd = dto.totalCopies - book.totalCopies;
          const highestCopyNum = book.copies.reduce(
            (max, c) => Math.max(max, c.copyNumber),
            0
          );

          const newCopies = [];
          for (let i = 1; i <= copiesToAdd; i++) {
            const nextNum = highestCopyNum + i;
            const copyNumStr = nextNum.toString().padStart(3, "0");
            newCopies.push({
              schoolId,
              bookId: book.id,
              copyNumber: nextNum,
              barcode: `LIB-${(dto.isbn || book.isbn).trim()}-${copyNumStr}`,
              status: BookCopyStatus.AVAILABLE,
              condition: "NEW",
            });
          }

          await tx.bookCopy.createMany({ data: newCopies });
          newAvailableCopies += copiesToAdd;
          newTotalCopies = dto.totalCopies;
        } else if (dto.totalCopies < book.totalCopies) {
          // Remove available copies
          const copiesToRemove = book.totalCopies - dto.totalCopies;
          const availableCopies = await tx.bookCopy.findMany({
            where: {
              bookId: book.id,
              schoolId,
              status: BookCopyStatus.AVAILABLE,
            },
            take: copiesToRemove,
            orderBy: { copyNumber: "desc" },
          });

          if (availableCopies.length < copiesToRemove) {
            throw new BadRequestException(
              `Not enough free copies available to reduce inventory by ${copiesToRemove}.`
            );
          }

          const removeIds = availableCopies.map((c) => c.id);
          await tx.bookCopy.deleteMany({
            where: { id: { in: removeIds } },
          });

          newAvailableCopies -= copiesToRemove;
          newTotalCopies = dto.totalCopies;
        }
      }

      const updated = await tx.book.update({
        where: { id },
        data: {
          ...(dto.isbn && { isbn: dto.isbn.trim() }),
          ...(dto.title && { title: dto.title.trim() }),
          ...(dto.author && { author: dto.author.trim() }),
          ...(dto.category && { category: dto.category.trim() }),
          ...(dto.publisher !== undefined && { publisher: dto.publisher?.trim() || null }),
          ...(dto.edition !== undefined && { edition: dto.edition?.trim() || null }),
          ...((dto.shelfLocation !== undefined || dto.locationRack !== undefined) && {
            shelfLocation: (dto.shelfLocation || dto.locationRack)?.trim() || null,
          }),
          ...(dto.description !== undefined && {
            description: dto.description?.trim() || null,
          }),
          totalCopies: newTotalCopies,
          availableCopies: newAvailableCopies,
        },
        include: { copies: true },
      });

      await this.audit.log(
        {
          action: "BOOK_UPDATED",
          entity: "Book",
          entityId: id,
          schoolId,
          userId: user.id,
          details: { changes: dto },
          ipAddress,
        },
        tx
      );

      return updated;
    });
  }

  async deleteBook(
    schoolId: string,
    id: string,
    user: any,
    ipAddress?: string
  ) {
    await this.assertLibraryModuleEnabled(schoolId);

    const book = await this.prisma.book.findFirst({
      where: { id, schoolId },
      include: {
        issues: {
          where: {
            status: { in: [BookIssueStatus.ISSUED, BookIssueStatus.OVERDUE] },
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException("Book not found in this school catalogue.");
    }

    if (book.issues.length > 0) {
      throw new BadRequestException(
        `Cannot delete book '${book.title}'. There are ${book.issues.length} active copy issues.`
      );
    }

    await this.prisma.book.delete({
      where: { id },
    });

    await this.audit.log({
      action: "BOOK_DELETED",
      entity: "Book",
      entityId: id,
      schoolId,
      userId: user.id,
      details: { title: book.title, isbn: book.isbn },
      ipAddress,
    });

    return { message: "Book and copies successfully removed from catalogue." };
  }

  async getBooks(schoolId: string, query: QueryBooksDto) {
    await this.assertLibraryModuleEnabled(schoolId);

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {
      schoolId,
      ...(query.category && {
        category: { equals: query.category, mode: "insensitive" },
      }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { author: { contains: query.search, mode: "insensitive" } },
          { isbn: { contains: query.search, mode: "insensitive" } },
          { publisher: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        include: {
          copies: {
            select: {
              id: true,
              copyNumber: true,
              barcode: true,
              status: true,
              condition: true,
            },
          },
          _count: {
            select: {
              issues: {
                where: {
                  status: { in: [BookIssueStatus.ISSUED, BookIssueStatus.OVERDUE] },
                },
              },
            },
          },
        },
        orderBy: { title: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.book.count({ where }),
    ]);

    const mapped = books.map((b) => ({
      ...b,
      locationRack: b.shelfLocation,
      activeIssuesCount: b._count.issues,
    }));

    return {
      books: mapped,
      data: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBookById(schoolId: string, id: string) {
    await this.assertLibraryModuleEnabled(schoolId);

    const book = await this.prisma.book.findFirst({
      where: { id, schoolId },
      include: {
        copies: {
          orderBy: { copyNumber: "asc" },
        },
        issues: {
          orderBy: { issuedDate: "desc" },
          take: 10,
          include: {
            student: { select: { id: true, fullName: true, admissionNumber: true, gradeLevel: true } },
            user: { select: { id: true, fullName: true, email: true, role: true } },
            copy: { select: { copyNumber: true, barcode: true } },
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException("Book not found in this school catalogue.");
    }

    return {
      ...book,
      locationRack: book.shelfLocation,
    };
  }

  // =========================================================================
  // 4. CIRCULATION: ISSUE BOOK (Safe Concurrency, Stock Consistency)
  // =========================================================================

  async issueBook(
    schoolId: string,
    dto: IssueBookDto,
    issuedByUser: any,
    ipAddress?: string
  ) {
    await this.assertLibraryModuleEnabled(schoolId);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Verify Book & Availability
      const book = await tx.book.findFirst({
        where: { id: dto.bookId, schoolId },
      });

      if (!book) {
        throw new NotFoundException("Book not found in catalogue.");
      }

      if (book.availableCopies <= 0) {
        throw new BadRequestException(
          `No available copies of '${book.title}' in library stock.`
        );
      }

      // 2. Fetch Settings
      let settings = await tx.librarySetting.findUnique({
        where: { schoolId },
      });
      if (!settings) {
        settings = await tx.librarySetting.create({
          data: {
            schoolId,
            defaultLoanDays: 14,
            maxBooksPerStudent: 3,
            maxBooksPerStaff: 5,
            finePerDay: 5.0,
            maxRenewals: 2,
          },
        });
      }

      // 3. Verify Borrower & Borrowing Limits
      let student = null;
      let staffUser = null;

      if (dto.borrowerType === BorrowerType.STUDENT) {
        if (!dto.studentId) {
          throw new BadRequestException("Student ID is required for student borrower.");
        }
        student = await tx.student.findFirst({
          where: { id: dto.studentId, schoolId },
        });
        if (!student) {
          throw new NotFoundException("Student record not found in this school.");
        }

        const activeStudentIssues = await tx.bookIssue.count({
          where: {
            schoolId,
            studentId: student.id,
            status: { in: [BookIssueStatus.ISSUED, BookIssueStatus.OVERDUE] },
          },
        });

        if (activeStudentIssues >= settings.maxBooksPerStudent) {
          throw new BadRequestException(
            `Student borrowing limit exceeded. Student already has ${activeStudentIssues} active book(s) on loan (max allowed: ${settings.maxBooksPerStudent}).`
          );
        }
      } else {
        const staffId = dto.userId || dto.staffUserId;
        if (!staffId) {
          throw new BadRequestException("User ID is required for staff borrower.");
        }
        staffUser = await tx.user.findFirst({
          where: { id: staffId, schoolId },
        });
        if (!staffUser) {
          throw new NotFoundException("Staff member not found in this school.");
        }

        const activeStaffIssues = await tx.bookIssue.count({
          where: {
            schoolId,
            userId: staffUser.id,
            status: { in: [BookIssueStatus.ISSUED, BookIssueStatus.OVERDUE] },
          },
        });

        if (activeStaffIssues >= settings.maxBooksPerStaff) {
          throw new BadRequestException(
            `Staff borrowing limit exceeded. Staff member already has ${activeStaffIssues} active book(s) on loan (max allowed: ${settings.maxBooksPerStaff}).`
          );
        }
      }

      // 4. Find and Lock Available Copy
      let copy = null;
      const targetCopyId = dto.copyId || dto.bookCopyId;

      if (targetCopyId) {
        copy = await tx.bookCopy.findFirst({
          where: {
            id: targetCopyId,
            bookId: book.id,
            schoolId,
            status: BookCopyStatus.AVAILABLE,
          },
        });
        if (!copy) {
          throw new BadRequestException(
            "Selected book copy is not available for issue or does not exist."
          );
        }
      } else if (dto.barcode) {
        copy = await tx.bookCopy.findFirst({
          where: {
            barcode: dto.barcode.trim(),
            bookId: book.id,
            schoolId,
            status: BookCopyStatus.AVAILABLE,
          },
        });
        if (!copy) {
          throw new BadRequestException(
            `Book copy with barcode '${dto.barcode}' is not available for issue.`
          );
        }
      } else {
        // Auto-assign first available copy
        copy = await tx.bookCopy.findFirst({
          where: {
            bookId: book.id,
            schoolId,
            status: BookCopyStatus.AVAILABLE,
          },
          orderBy: { copyNumber: "asc" },
        });
        if (!copy) {
          throw new BadRequestException(
            "No free physical copies available for this book."
          );
        }
      }

      // Prevent duplicate active issue on this copy
      const activeIssueOnCopy = await tx.bookIssue.findFirst({
        where: {
          copyId: copy.id,
          status: { in: [BookIssueStatus.ISSUED, BookIssueStatus.OVERDUE] },
        },
      });
      if (activeIssueOnCopy) {
        throw new ConflictException(
          `Copy #${copy.copyNumber} (${copy.barcode}) is already checked out.`
        );
      }

      // 5. Calculate Due Date
      const issuedDate = new Date();
      let dueDate: Date;
      if (dto.dueDate) {
        dueDate = new Date(dto.dueDate);
        if (isNaN(dueDate.getTime())) {
          throw new BadRequestException("Due date must be a valid ISO date string.");
        }
      } else {
        dueDate = new Date(
          issuedDate.getTime() + settings.defaultLoanDays * 24 * 60 * 60 * 1000
        );
      }

      // 6. Create Book Issue Record
      const issue = await tx.bookIssue.create({
        data: {
          schoolId,
          bookId: book.id,
          copyId: copy.id,
          borrowerType: dto.borrowerType,
          studentId: student?.id || null,
          userId: staffUser?.id || null,
          issuedById: issuedByUser.id,
          issuedDate,
          dueDate,
          finePerDay: settings.finePerDay,
          maxRenewals: settings.maxRenewals,
          status: BookIssueStatus.ISSUED,
          remarks: dto.remarks?.trim() || null,
        },
        include: {
          book: true,
          copy: true,
          student: true,
          user: true,
        },
      });

      // 7. Update Copy Status
      await tx.bookCopy.update({
        where: { id: copy.id },
        data: { status: BookCopyStatus.ISSUED },
      });

      // 8. Decrement Available Copies
      await tx.book.update({
        where: { id: book.id },
        data: { availableCopies: { decrement: 1 } },
      });

      // 9. Audit Log
      await this.audit.log(
        {
          action: "BOOK_ISSUED",
          entity: "BookIssue",
          entityId: issue.id,
          schoolId,
          userId: issuedByUser.id,
          details: {
            bookTitle: book.title,
            isbn: book.isbn,
            copyNumber: copy.copyNumber,
            barcode: copy.barcode,
            borrowerType: dto.borrowerType,
            borrowerName: student?.fullName || staffUser?.fullName,
            dueDate: dueDate.toISOString(),
          },
          ipAddress,
        },
        tx
      );

      return {
        ...issue,
        copy: { ...issue.copy, status: BookCopyStatus.ISSUED },
        bookCopy: { ...issue.copy, status: BookCopyStatus.ISSUED },
        issueDate: issue.issuedDate,
        returnDate: issue.returnedDate,
        staffUser: issue.user,
      };
    });
  }

  // =========================================================================
  // 5. CIRCULATION: RETURN BOOK (Atomic Fine Calculation & Inventory Restore)
  // =========================================================================

  async returnBook(
    schoolId: string,
    issueId: string,
    dto: ReturnBookDto,
    returnedByUser: any,
    ipAddress?: string
  ) {
    await this.assertLibraryModuleEnabled(schoolId);

    return await this.prisma.$transaction(async (tx) => {
      const issue = await tx.bookIssue.findFirst({
        where: { id: issueId, schoolId },
        include: {
          book: true,
          copy: true,
          student: true,
          user: true,
        },
      });

      if (!issue) {
        throw new NotFoundException("Book issue record not found.");
      }

      if (issue.status === BookIssueStatus.RETURNED) {
        throw new BadRequestException("This book has already been returned.");
      }

      const returnDate = dto.returnedDate ? new Date(dto.returnedDate) : new Date();
      const dueDate = new Date(issue.dueDate);

      // Overdue & Fine Calculation
      // 1 day = 86,400,000 ms
      const diffMs = returnDate.getTime() - dueDate.getTime();
      const overdueDays = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
      const finePerDay = Number(issue.finePerDay);
      const calculatedFine = overdueDays * finePerDay;

      const isPaid = dto.isFinePaid !== undefined ? dto.isFinePaid : calculatedFine === 0;

      // Update Issue
      const updatedIssue = await tx.bookIssue.update({
        where: { id: issue.id },
        data: {
          status: BookIssueStatus.RETURNED,
          returnedDate: returnDate,
          fineAmount: new Prisma.Decimal(calculatedFine),
          isFinePaid: isPaid,
          finePaidAt: isPaid && calculatedFine > 0 ? new Date() : null,
          finePaidRemarks: dto.finePaidRemarks?.trim() || null,
          remarks: dto.remarks
            ? issue.remarks
              ? `${issue.remarks} | ${dto.remarks.trim()}`
              : dto.remarks.trim()
            : issue.remarks,
        },
        include: {
          book: true,
          copy: true,
          student: true,
          user: true,
        },
      });

      // Restore copy status
      await tx.bookCopy.update({
        where: { id: issue.copyId },
        data: { status: BookCopyStatus.AVAILABLE },
      });

      // Increment available copies
      await tx.book.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 } },
      });

      // Audit Log
      await this.audit.log(
        {
          action: "BOOK_RETURNED",
          entity: "BookIssue",
          entityId: issue.id,
          schoolId,
          userId: returnedByUser.id,
          details: {
            bookTitle: issue.book.title,
            copyNumber: issue.copy.copyNumber,
            barcode: issue.copy.barcode,
            overdueDays,
            fineAmount: calculatedFine,
            isFinePaid: isPaid,
          },
          ipAddress,
        },
        tx
      );

      const updatedCopy = await tx.bookCopy.findUnique({ where: { id: issue.copyId } });
      return {
        ...updatedIssue,
        copy: updatedCopy,
        bookCopy: updatedCopy,
        issueDate: updatedIssue.issuedDate,
        returnDate: updatedIssue.returnedDate,
        overdueDays,
        fineAmount: calculatedFine,
      };
    });
  }

  // =========================================================================
  // 6. CIRCULATION: RENEW BOOK
  // =========================================================================

  async renewBook(
    schoolId: string,
    issueId: string,
    dto: RenewBookDto,
    renewedByUser: any,
    ipAddress?: string
  ) {
    await this.assertLibraryModuleEnabled(schoolId);

    return await this.prisma.$transaction(async (tx) => {
      const issue = await tx.bookIssue.findFirst({
        where: { id: issueId, schoolId },
        include: { book: true, copy: true },
      });

      if (!issue) {
        throw new NotFoundException("Book issue record not found.");
      }

      if (issue.status === BookIssueStatus.RETURNED) {
        throw new BadRequestException("Cannot renew a returned book.");
      }

      const now = new Date();
      if (new Date(issue.dueDate) < now) {
        throw new BadRequestException(
          "Cannot renew an overdue book. Overdue books must be returned and late fines assessed."
        );
      }

      if (issue.renewalCount >= issue.maxRenewals) {
        throw new BadRequestException(
          `Renewal limit reached. Maximum ${issue.maxRenewals} renewal(s) allowed.`
        );
      }

      const settings = await this.getSettings(schoolId);
      const extensionDays = dto.days || settings.defaultLoanDays;
      const currentDueDate = new Date(issue.dueDate);
      const newDueDate = new Date(
        currentDueDate.getTime() + extensionDays * 24 * 60 * 60 * 1000
      );

      const renewed = await tx.bookIssue.update({
        where: { id: issue.id },
        data: {
          dueDate: newDueDate,
          renewalCount: { increment: 1 },
          remarks: dto.remarks
            ? `${issue.remarks ? issue.remarks + " | " : ""}Renewed: ${dto.remarks.trim()}`
            : issue.remarks,
        },
        include: {
          book: true,
          copy: true,
          student: true,
          user: true,
        },
      });

      await this.audit.log(
        {
          action: "BOOK_RENEWED",
          entity: "BookIssue",
          entityId: issue.id,
          schoolId,
          userId: renewedByUser.id,
          details: {
            bookTitle: issue.book.title,
            renewalCount: renewed.renewalCount,
            newDueDate: newDueDate.toISOString(),
            extendedDays: extensionDays,
          },
          ipAddress,
        },
        tx
      );

      return {
        ...renewed,
        bookCopy: renewed.copy,
        issueDate: renewed.issuedDate,
        returnDate: renewed.returnedDate,
        staffUser: renewed.user,
      };
    });
  }

  // =========================================================================
  // 7. AUDITED FEE-LEDGER ADJUSTMENT (Requirement 4: Explicit, Audited Workflow)
  // =========================================================================

  async adjustFineToFee(
    schoolId: string,
    issueId: string,
    dto: AdjustFineDto,
    authorizedUser: any,
    ipAddress?: string
  ) {
    await this.assertLibraryModuleEnabled(schoolId);

    // Rule 4: Only School Admin or Accountant can explicitly adjust to fee ledger
    const allowedRoles: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.SCHOOL_ADMIN,
      UserRole.ACCOUNTANT,
    ];
    if (!allowedRoles.includes(authorizedUser.role)) {
      throw new ForbiddenException(
        "Only School Admin or Accountant is authorized to post library fines to the fee ledger."
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      const issue = await tx.bookIssue.findFirst({
        where: { id: issueId, schoolId },
        include: {
          book: true,
          copy: true,
          student: {
            include: {
              feePlans: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
          user: true,
        },
      });

      if (!issue) {
        throw new NotFoundException("Book issue record not found.");
      }

      const fineAmount = Number(issue.fineAmount);
      if (fineAmount <= 0) {
        throw new BadRequestException("This issue has no outstanding fine amount to adjust.");
      }

      if (issue.fineAdjustedToFee) {
        throw new BadRequestException(
          "Fine has already been adjusted to the fee ledger."
        );
      }

      if (!issue.studentId || !issue.student) {
        throw new BadRequestException(
          "Fee ledger adjustment is currently applicable for student borrowers with fee accounts."
        );
      }

      // Check student fee plan
      const studentFeePlan = issue.student.feePlans[0];
      if (!studentFeePlan) {
        throw new BadRequestException(
          "Student has no active fee plan. Fee ledger adjustment requires an enrolled fee plan."
        );
      }

      // Generate audited FeePayment receipt
      const receiptNum = `REC-LIB-${Date.now().toString().slice(-6)}`;
      const feePayment = await tx.feePayment.create({
        data: {
          schoolId,
          studentId: issue.student.id,
          studentFeePlanId: studentFeePlan.id,
          receiptNumber: receiptNum,
          amount: new Prisma.Decimal(fineAmount),
          paymentMethod: dto.paymentMethod || "CASH",
          transactionReference:
            dto.transactionReference || `LIB-FINE-${issue.id.slice(0, 8).toUpperCase()}`,
          remarks:
            dto.remarks ||
            `Library late-return fine for '${issue.book.title}' (${issue.copy.barcode})`,
          collectedById: authorizedUser.id,
          status: "SUCCESS",
        },
      });

      // Update student fee plan ledger
      await tx.studentFeePlan.update({
        where: { id: studentFeePlan.id },
        data: {
          paidAmount: { increment: new Prisma.Decimal(fineAmount) },
          balanceAmount: {
            decrement: new Prisma.Decimal(Math.min(fineAmount, Number(studentFeePlan.balanceAmount))),
          },
        },
      });

      // Mark fineAdjustedToFee on the BookIssue
      const updatedIssue = await tx.bookIssue.update({
        where: { id: issue.id },
        data: {
          fineAdjustedToFee: true,
          fineFeePaymentId: feePayment.id,
          fineAdjustedAt: new Date(),
          fineAdjustedById: authorizedUser.id,
          isFinePaid: true,
          finePaidAt: new Date(),
          finePaidRemarks: `Adjusted to fee receipt ${receiptNum}`,
        },
        include: {
          book: true,
          copy: true,
          student: true,
          fineFeePayment: true,
        },
      });

      // Audit Log for Ledger Adjustment
      await this.audit.log(
        {
          action: "LIBRARY_FINE_ADJUSTED_TO_FEE",
          entity: "BookIssue",
          entityId: issue.id,
          schoolId,
          userId: authorizedUser.id,
          details: {
            bookTitle: issue.book.title,
            studentId: issue.student.id,
            studentName: issue.student.fullName,
            fineAmount,
            feeReceiptNumber: receiptNum,
            feePaymentId: feePayment.id,
            remarks: dto.remarks,
          },
          ipAddress,
        },
        tx
      );

      return {
        message: "Fine successfully adjusted and recorded in fee ledger.",
        ...updatedIssue,
        issue: updatedIssue,
        fineFeePaymentId: feePayment.id,
        fineFeePayment: feePayment,
        feePayment,
        bookCopy: updatedIssue.copy,
        issueDate: updatedIssue.issuedDate,
        returnDate: updatedIssue.returnedDate,
      };
    });
  }

  // =========================================================================
  // 8. QUERY ISSUES & OVERDUE
  // =========================================================================

  async getIssues(schoolId: string, query: QueryIssuesDto) {
    await this.assertLibraryModuleEnabled(schoolId);

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.BookIssueWhereInput = {
      schoolId,
      ...(query.status && {
        status: query.status as BookIssueStatus,
      }),
      ...(query.borrowerType && {
        borrowerType: query.borrowerType as BorrowerType,
      }),
      ...(query.studentId && {
        studentId: query.studentId,
      }),
      ...(query.userId && {
        userId: query.userId,
      }),
    };

    const [issues, total] = await Promise.all([
      this.prisma.bookIssue.findMany({
        where,
        include: {
          book: true,
          copy: true,
          student: {
            select: {
              id: true,
              fullName: true,
              admissionNumber: true,
              gradeLevel: true,
              section: true,
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              employeeId: true,
            },
          },
          issuedBy: {
            select: {
              id: true,
              fullName: true,
              role: true,
            },
          },
          fineFeePayment: {
            select: {
              id: true,
              receiptNumber: true,
              amount: true,
            },
          },
        },
        orderBy: { issuedDate: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.bookIssue.count({ where }),
    ]);

    const now = new Date();
    const processedIssues = issues.map((item) => {
      let isOverdue = false;
      let overdueDays = 0;
      let dynamicFine = Number(item.fineAmount);

      if (
        item.status === BookIssueStatus.ISSUED &&
        new Date(item.dueDate) < now
      ) {
        isOverdue = true;
        const diffMs = now.getTime() - new Date(item.dueDate).getTime();
        overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        dynamicFine = overdueDays * Number(item.finePerDay);
      }

      return {
        ...item,
        isOverdue,
        overdueDays,
        currentFineAmount: dynamicFine,
      };
    });

    const mappedIssues = processedIssues.map((item) => ({
      ...item,
      bookCopy: item.copy,
      issueDate: item.issuedDate,
      returnDate: item.returnedDate,
      staffUser: item.user,
    }));

    return {
      issues: mappedIssues,
      data: mappedIssues,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOverdueIssues(schoolId: string) {
    await this.assertLibraryModuleEnabled(schoolId);

    const now = new Date();
    const issues = await this.prisma.bookIssue.findMany({
      where: {
        schoolId,
        status: { in: [BookIssueStatus.ISSUED, BookIssueStatus.OVERDUE] },
        dueDate: { lt: now },
      },
      include: {
        book: true,
        copy: true,
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            gradeLevel: true,
            section: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            employeeId: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return issues.map((item) => {
      const diffMs = now.getTime() - new Date(item.dueDate).getTime();
      const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const finePerDay = Number(item.finePerDay);
      const accumulatedFine = overdueDays * finePerDay;

      return {
        ...item,
        bookCopy: item.copy,
        issueDate: item.issuedDate,
        returnDate: item.returnedDate,
        staffUser: item.user,
        overdueDays,
        accumulatedFine,
        calculatedFine: accumulatedFine,
      };
    });
  }

  // =========================================================================
  // 9. STUDENT & PARENT RESTRICTED VIEWS
  // =========================================================================

  async getStudentLoans(schoolId: string, studentId: string) {
    await this.assertLibraryModuleEnabled(schoolId);

    const issues = await this.prisma.bookIssue.findMany({
      where: { schoolId, studentId },
      include: {
        book: true,
        copy: true,
      },
      orderBy: { issuedDate: "desc" },
    });

    const now = new Date();
    return issues.map((item) => {
      const isOverdue =
        item.status === BookIssueStatus.ISSUED && new Date(item.dueDate) < now;
      let overdueDays = 0;
      let dynamicFine = Number(item.fineAmount);

      if (isOverdue) {
        const diffMs = now.getTime() - new Date(item.dueDate).getTime();
        overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        dynamicFine = overdueDays * Number(item.finePerDay);
      }

      return {
        ...item,
        bookCopy: item.copy,
        issueDate: item.issuedDate,
        returnDate: item.returnedDate,
        isOverdue,
        overdueDays,
        currentFineAmount: dynamicFine,
      };
    });
  }

  async getParentStudentLoans(schoolId: string, parentUserId: string) {
    await this.assertLibraryModuleEnabled(schoolId);

    const linkages = await this.prisma.parentStudent.findMany({
      where: { parentId: parentUserId },
      include: {
        student: true,
      },
    });

    const studentIds = linkages.map((l) => l.studentId);
    if (studentIds.length === 0) {
      return [];
    }

    const issues = await this.prisma.bookIssue.findMany({
      where: {
        schoolId,
        studentId: { in: studentIds },
      },
      include: {
        book: true,
        copy: true,
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            gradeLevel: true,
            section: true,
          },
        },
      },
      orderBy: { issuedDate: "desc" },
    });

    const now = new Date();
    const processedIssues = issues.map((item) => {
      const isOverdue =
        item.status === BookIssueStatus.ISSUED && new Date(item.dueDate) < now;
      let overdueDays = 0;
      let dynamicFine = Number(item.fineAmount);

      if (isOverdue) {
        const diffMs = now.getTime() - new Date(item.dueDate).getTime();
        overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        dynamicFine = overdueDays * Number(item.finePerDay);
      }

      return {
        ...item,
        bookCopy: item.copy,
        issueDate: item.issuedDate,
        returnDate: item.returnedDate,
        isOverdue,
        overdueDays,
        currentFineAmount: dynamicFine,
      };
    });

    return linkages.map((l) => ({
      student: l.student,
      issues: processedIssues.filter((i) => i.studentId === l.studentId),
    }));
  }

  // =========================================================================
  // 10. DASHBOARD STATS
  // =========================================================================

  async getStats(schoolId: string) {
    await this.assertLibraryModuleEnabled(schoolId);

    const now = new Date();
    const [
      totalTitles,
      totalCopiesAggr,
      issuedCopies,
      overdueCount,
      finesAggr,
    ] = await Promise.all([
      this.prisma.book.count({ where: { schoolId } }),
      this.prisma.book.aggregate({
        where: { schoolId },
        _sum: { totalCopies: true, availableCopies: true },
      }),
      this.prisma.bookIssue.count({
        where: {
          schoolId,
          status: { in: [BookIssueStatus.ISSUED, BookIssueStatus.OVERDUE] },
        },
      }),
      this.prisma.bookIssue.count({
        where: {
          schoolId,
          status: { in: [BookIssueStatus.ISSUED, BookIssueStatus.OVERDUE] },
          dueDate: { lt: now },
        },
      }),
      this.prisma.bookIssue.aggregate({
        where: { schoolId, isFinePaid: true },
        _sum: { fineAmount: true },
      }),
    ]);

    return {
      totalTitles,
      totalCopies: totalCopiesAggr._sum.totalCopies || 0,
      availableCopies: totalCopiesAggr._sum.availableCopies || 0,
      issuedCopies,
      overdueCount,
      totalFinesCollected: Number(finesAggr._sum.fineAmount || 0),
    };
  }
}
