import React from "react";

const Notes = ({ selectedDate, notes, setNotes }) => {
  return (
    <div className="mt-4">
      <h2 className="font-semibold mb-2">
        Notes for {selectedDate || "Select a date"}
      </h2>

      <textarea
        className="w-full border p-2 rounded-lg"
        rows="4"
        value={notes[selectedDate] || ""}
        onChange={(e) =>
          setNotes({ ...notes, [selectedDate]: e.target.value })
        }
      />
    </div>
  );
};

export default Notes;