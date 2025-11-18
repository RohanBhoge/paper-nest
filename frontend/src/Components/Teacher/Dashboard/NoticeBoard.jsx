import React from "react";
import { Bell, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NoticeBoard = ({ notices }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
    {/* Header */}
    <div className="flex items-center gap-2 mb-4">
      <Bell className="text-blue-600" size={22} />
      <h2 className="text-xl font-bold text-slate-900">Notice Board</h2>
    </div>

    {/* Notice List */}
    <div className="max-h-80 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-slate-100">
      <div className="space-y-3 pr-1">
        <AnimatePresence>
          {notices.map((notice, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: index * 0.1,
              }}
              whileHover={{
                scale: 1.03,
                rotate: 0.5,
                transition: { duration: 0.2 },
              }}
              className={`p-4 rounded-lg border-l-4 relative cursor-pointer ${
                notice.isNew
                  ? "bg-blue-50 border-blue-500"
                  : "bg-slate-50 border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-slate-800 font-medium break-words">
                  {notice.text}
                </p>
                <div className="flex items-center gap-2">
                  {notice.isNew && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 250,
                        damping: 10,
                      }}
                      className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-sm"
                    >
                      NEW
                    </motion.span>
                  )}
                  <ChevronRight className="text-slate-400" size={16} />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  </div>
);

export default NoticeBoard;
