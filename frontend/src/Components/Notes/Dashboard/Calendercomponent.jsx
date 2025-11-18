import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { X } from "lucide-react";

const CalendarComponent = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState("");

  // Auto delete past reminders
  useEffect(() => {
    const today = new Date();
    setReminders((prev) =>
      prev.filter(
        (r) =>
          new Date(r.date).setHours(0, 0, 0, 0) >= today.setHours(0, 0, 0, 0)
      )
    );
  }, []);

  const handleAddReminder = () => {
    if (!newReminder.trim()) return;
    const reminder = {
      id: Date.now(),
      text: newReminder,
      date: selectedDate,
    };
    setReminders([...reminders, reminder]);
    setNewReminder("");
    setShowAddReminder(false);
  };

  const handleDeleteReminder = (id) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const tileClassName = ({ date }) => {
    const hasReminder = reminders.some(
      (r) => new Date(r.date).toDateString() === date.toDateString()
    );
    return hasReminder ? "highlight" : null;
  };

  return (
    <div className="min-h-screen p-6 mt-4 ml-3">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Academic Calendar */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
            📅 Academic Calendar
          </h2>

          <div className="flex justify-center mb-6">
            <Calendar
              onChange={(date) => {
                setSelectedDate(date);
                setShowAddReminder(true);
              }}
              value={selectedDate}
              tileClassName={tileClassName}
              className="react-calendar border-0 rounded-xl"
            />
          </div>

          {/* Add Reminder Section (only visible after date click) */}
          {showAddReminder && selectedDate && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg relative">
              <button
                onClick={() => setShowAddReminder(false)}
                className="absolute top-2 right-2 text-blue-800 hover:text-red-500 transition"
              >
                <X size={18} />
              </button>

              <h3 className="font-semibold text-blue-900 mb-3">
                Add Reminder for{" "}
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>

              <div className="flex flex-col items-center gap-3">
                <input
                  type="text"
                  value={newReminder}
                  onChange={(e) => setNewReminder(e.target.value)}
                  placeholder="Enter reminder..."
                  className="w-full sm:w-2/3 border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleAddReminder}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Reminders */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
            🔔 Upcoming Reminders
          </h2>

          {reminders.length > 0 ? (
            <div className="space-y-3">
              {reminders
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-blue-900 font-medium">{r.text}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(r.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteReminder(r.id)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No upcoming reminders 🎉</p>
          )}
        </div>
      </div>

      <style>{`
        .highlight {
          background: linear-gradient(135deg, #3b82f6, #1e40af) !important;
          color: white !important;
          border-radius: 50%;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(37,99,235,0.3);
        }
      `}</style>
    </div>
  );
};

export default CalendarComponent;
