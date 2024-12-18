"use client";
import { useState } from "react";
import axios from "axios";

const NewPollPage = () => {
  const [pollName, setPollName] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const removeOption = (index: number) => {
    const newOptions = pollOptions.filter((_, i) => i !== index);
    setPollOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pollOptions.length < 2) {
      setError("Please provide at least two options.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/api/polls/create",
        {
          poll_name: pollName,
          poll_description: pollDescription,
          poll_options: pollOptions,
        },
        {
          withCredentials: true,
        }
      );
      console.log("Poll created with ID:", response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to create poll.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create a New Poll</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Poll Name:
          </label>
          <input
            type="text"
            value={pollName}
            onChange={(e) => setPollName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Poll Description:
          </label>
          <textarea
            value={pollDescription}
            onChange={(e) => setPollDescription(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Poll Options:
          </label>
          {pollOptions.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 mt-2">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Option
          </button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-green-500 text-white rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Create Poll
        </button>
      </form>
    </div>
  );
};

export default NewPollPage;
