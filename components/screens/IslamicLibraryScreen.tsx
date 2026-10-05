import React, { useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, BookOpenIcon, AcademicCapIcon } from "@heroicons/react/24/outline";

interface IslamicLibraryScreenProps {
  onBack: () => void;
}

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  description: string;
  pages: number;
  language: string;
}

const BOOKS: Book[] = [
  { id: 1, title: "تفسير ابن كثير", author: "ابن كثير", category: "التفسير", description: "تفسير القرآن العظيم من أشهر كتب التفسير", pages: 4000, language: "العربية" },
  { id: 2, title: "صحيح البخاري", author: "محمد بن إسماعيل البخاري", category: "الحديث", description: "أصح كتب الحديث النبوي", pages: 3000, language: "العربية" },
  { id: 3, title: "صحيح مسلم", author: "مسلم بن الحجاج", category: "الحديث", description: "ثاني أصح كتب الحديث", pages: 2500, language: "العربية" },
  { id: 4, title: "رياض الصالحين", author: "النووي", category: "الحديث", description: "جامع للأحاديث النبوية", pages: 1500, language: "العربية" },
  { id: 5, title: "فقه السنة", author: "السيد سابق", category: "الفقه", description: "كتاب في فقه السنة", pages: 1200, language: "العربية" },
  { id: 6, title: "السيرة النبوية", author: "ابن هشام", category: "السيرة", description: "سيرة النبي صلى الله عليه وسلم", pages: 800, language: "العربية" },
  { id: 7, title: "العقيدة الواسطية", author: "ابن تيمية", category: "العقيدة", description: "كتاب في العقيدة الإسلامية", pages: 200, language: "العربية" },
  { id: 8, title: "إحياء علوم الدين", author: "الغزالي", category: "التصوف", description: "كتاب في التصوف والأخلاق", pages: 2000, language: "العربية" },
  { id: 9, title: "فقه الصلاة", author: "محمد بن صالح العثيمين", category: "الفقه", description: "كتاب في فقه الصلاة", pages: 300, language: "العربية" },
  { id: 10, title: "فقه الصيام", author: "محمد بن صالح العثيمين", category: "الفقه", description: "كتاب في فقه الصيام", pages: 200, language: "العربية" },
];

const CATEGORIES = ["الكل", "التفسير", "الحديث", "الفقه", "السيرة", "العقيدة", "التصوف"];

const IslamicLibraryScreen: React.FC<IslamicLibraryScreenProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = BOOKS.filter(book => {
    const matchesCategory = selectedCategory === "الكل" || book.category === selectedCategory;
    const matchesSearch = book.title.includes(searchQuery) || book.author.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            aria-label="رجوع"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">المكتبة الإسلامية</h1>
          <div className="w-10" />
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <input
            type="text"
            placeholder="ابحث عن كتاب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Categories */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={"px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors " +
                  (selectedCategory === category
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white")}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Books List */}
      <div className="flex-grow overflow-y-auto p-4">
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-300">لا توجد نتائج مطابقة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpenIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{book.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">{book.author}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{book.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-300">
                      <span className="flex items-center gap-1">
                        <AcademicCapIcon className="w-4 h-4" />
                        {book.category}
                      </span>
                      <span>{book.pages} صفحة</span>
                      <span>{book.language}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IslamicLibraryScreen;
