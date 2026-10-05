import React, { useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, CalculatorIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

interface ZakatScreenProps {
  onBack: () => void;
}

type ZakatType = "money" | "gold" | "silver" | "fitr";

const ZakatScreen: React.FC<ZakatScreenProps> = ({ onBack }) => {
  const [zakatType, setZakatType] = useState<ZakatType>("money");
  const [amount, setAmount] = useState<string>("");
  const [result, setResult] = useState<number | null>(null);

  const numericAmount = parseFloat(amount);
  const hasValidAmount = !isNaN(numericAmount) && numericAmount > 0;

  const calculateZakat = () => {
    if (!hasValidAmount) {
      setResult(null);
      return;
    }

    let zakat = 0;
    switch (zakatType) {
      case "money":
        zakat = numericAmount * 0.025; // 2.5%
        break;
      case "gold":
        zakat = numericAmount * 0.025; // 2.5% of gold value
        break;
      case "silver":
        zakat = numericAmount * 0.025; // 2.5% of silver value
        break;
      case "fitr":
        zakat = numericAmount; // Fixed amount per person
        break;
    }
    setResult(zakat);
  };

  // Switching the type invalidates the previous figure, so clear it instead of
  // leaving a stale amount on screen.
  const selectType = (type: ZakatType) => {
    setZakatType(type);
    setResult(null);
  };

  const changeAmount = (value: string) => {
    setAmount(value);
    setResult(null);
  };

  const zakatTypes: { id: ZakatType; name: string; desc: string }[] = [
    { id: "money", name: "زكاة المال", desc: "2.5% من المال" },
    { id: "gold", name: "زكاة الذهب", desc: "2.5% من قيمة الذهب" },
    { id: "silver", name: "زكاة الفضة", desc: "2.5% من قيمة الفضة" },
    { id: "fitr", name: "زكاة الفطر", desc: "مبلغ ثابت لكل شخص" },
  ];

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
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">حاسبة الزكاة</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        {/* Zakat Type Selector */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">نوع الزكاة</h2>
          <div className="grid grid-cols-2 gap-3">
            {zakatTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => selectType(type.id)}
                aria-pressed={zakatType === type.id}
                className={"p-4 rounded-xl border-2 transition-all " +
                  (zakatType === type.id
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800")}
              >
                <h3 className="font-semibold text-gray-800 dark:text-white">{type.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label htmlFor="zakat-amount" className="block text-lg font-semibold text-gray-800 dark:text-white mb-3">المبلغ</label>
          <div className="relative">
            <input
              id="zakat-amount"
              type="number"
              value={amount}
              onChange={(e) => changeAmount(e.target.value)}
              placeholder="أدخل المبلغ"
              className="w-full pl-14 pr-4 py-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">ر.س</span>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculateZakat}
          disabled={!hasValidAmount}
          className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CalculatorIcon className="w-6 h-6" />
          احسب الزكاة
        </button>

        {/* Result */}
        {result !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl p-6 text-center"
          >
            <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 mb-2">الزكاة المستحقة</h3>
            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{result.toFixed(2)}</p>
            <p className="text-emerald-600 dark:text-emerald-400">ر.س</p>
          </motion.div>
        )}

        {/* Info */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">معلومات عن الزكاة</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                الزكاة هي الركن الثالث من أركان الإسلام، وهي واجبة على كل مسلم بالغ عاقل يملك النصاب.
                نصاب المال هو ما يعادل 85 جراماً من الذهب الخالص.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZakatScreen;
