"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bookmark,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Barcode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/services/api";

export default function LibraryBooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    id: "",
    isbn: "",
    title: "",
    author: "",
    category: "General",
    publisher: "",
    edition: "",
    description: "",
    locationRack: "",
    initialCopies: 1,
  });

  const showToast = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.library.getBooks({
        search: search || undefined,
        category: category === "ALL" ? undefined : category,
        limit: 100,
      });
      setBooks(res.books || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.author) {
      showToast("error", "Title and Author are required");
      return;
    }
    setIsSubmitting(true);
    try {
      if (form.id) {
        await api.library.updateBook(form.id, {
          isbn: form.isbn || undefined,
          title: form.title,
          author: form.author,
          category: form.category,
          publisher: form.publisher || undefined,
          edition: form.edition || undefined,
          description: form.description || undefined,
          locationRack: form.locationRack || undefined,
        });
        showToast("success", "Book updated successfully!");
      } else {
        await api.library.createBook({
          isbn: form.isbn || undefined,
          title: form.title,
          author: form.author,
          category: form.category,
          publisher: form.publisher || undefined,
          edition: form.edition || undefined,
          description: form.description || undefined,
          locationRack: form.locationRack || undefined,
          initialCopies: Number(form.initialCopies) || 1,
        });
        showToast("success", "Book and physical copies added to catalogue!");
      }
      setShowAddModal(false);
      setForm({
        id: "",
        isbn: "",
        title: "",
        author: "",
        category: "General",
        publisher: "",
        edition: "",
        description: "",
        locationRack: "",
        initialCopies: 1,
      });
      loadBooks();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save book");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? Only books with 0 active loans can be deleted.")) return;
    try {
      await api.library.deleteBook(id);
      showToast("success", "Book removed from catalogue");
      loadBooks();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete book");
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Book Repository & Catalogue
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Browse collection volumes, shelf positions, physical barcodes and lending inventory.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setForm({
              id: "",
              isbn: "",
              title: "",
              author: "",
              category: "General",
              publisher: "",
              edition: "",
              description: "",
              locationRack: "",
              initialCopies: 1,
            });
            setShowAddModal(true);
          }}
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0"
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
          Acquire New Book
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search title, author, ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 text-xs border border-slate-200 rounded-lg px-2.5 bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="General">General</option>
            <option value="Science">Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Literature">Literature</option>
            <option value="History">History</option>
            <option value="Fiction">Fiction</option>
            <option value="Reference">Reference</option>
          </select>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={loadBooks}
          className="text-xs h-9 text-slate-600 border-slate-200 hover:bg-slate-50"
        >
          <RotateCw className="h-3.5 w-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Title & ISBN</th>
                <th className="py-3 px-4">Author & Publisher</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Shelf / Rack</th>
                <th className="py-3 px-4">Copies (Avail / Total)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading books...
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No books found.
                  </td>
                </tr>
              ) : (
                books.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{b.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {b.isbn ? `ISBN: ${b.isbn}` : "No ISBN recorded"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{b.author}</div>
                      <div className="text-[11px] text-slate-500">{b.publisher || "—"}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                        {b.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {b.locationRack || "General Shelf"}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            b.availableCopies > 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {b.availableCopies} Available
                        </span>
                        <span className="text-slate-400 text-[11px]">/ {b.totalCopies} total</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setForm({
                            id: b.id,
                            isbn: b.isbn || "",
                            title: b.title,
                            author: b.author,
                            category: b.category,
                            publisher: b.publisher || "",
                            edition: b.edition || "",
                            description: b.description || "",
                            locationRack: b.locationRack || "",
                            initialCopies: 1,
                          });
                          setShowAddModal(true);
                        }}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(b.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={form.id ? "Edit Book" : "Acquire New Book"}
        description="Enter book metadata, shelf location, and physical copies to catalog."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Book Title *</label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Author *</label>
              <Input
                required
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ISBN</label>
              <Input
                value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
              >
                <option value="General">General</option>
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Literature">Literature</option>
                <option value="History">History</option>
                <option value="Fiction">Fiction</option>
                <option value="Reference">Reference</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Publisher</label>
              <Input
                value={form.publisher}
                onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shelf / Rack</label>
              <Input
                value={form.locationRack}
                onChange={(e) => setForm({ ...form, locationRack: e.target.value })}
                className="text-xs"
              />
            </div>

            {!form.id && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Physical Copies to Generate
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={form.initialCopies}
                  onChange={(e) => setForm({ ...form, initialCopies: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              {isSubmitting ? "Saving..." : form.id ? "Update Book" : "Add to Repository"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
