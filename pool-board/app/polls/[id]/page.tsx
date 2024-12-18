import React from "react";
import axios from "axios";
import Chart from "./Chart";
import Vote from "./Vote";
interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  votes_count: number | null;
}

interface PollData {
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
  options: PollOption[];
}

type Params = Promise<{ id: string }>;

const Page = async ({ params }: { params: Params }) => {
  const { id } = await params;
  // console.log(id);
  let response = await axios.get(`http://localhost:8080/api/polls/${id}`);
  const pollData: PollData = response.data;
  response = await axios.get(`http://localhost:8080/api/polls/${id}/results`);
  const chartData = response.data;
  console.log("This is chart data: ", chartData);

  const series = chartData.percentage.map((item: [string, number]) => item[1]);
  const labels = chartData.percentage.map(
    (item: [string, number]) =>
      pollData.options.find((option) => option.id === item[0])?.option_text ||
      ""
  );

  return (
    <div className="p-5 max-w-xl mx-auto font-sans">
      <h1 className="text-center text-2xl font-bold text-gray-800">
        {pollData?.title}
      </h1>
      <p className="text-center text-gray-600">{pollData?.description}</p>
      <div className="mt-5">
        <h2 className="text-xl font-semibold text-gray-700">Options</h2>
        <ul className="list-none p-0">
          {pollData?.options.map((option) => (
            <li
              key={option.id}
              className="py-2 border-b border-gray-300 flex items-center"
            >
              <span className="font-bold flex-1">{option.option_text}</span>
              <div className="w-1/2 bg-gray-200 rounded-full h-4 mx-2">
                <div
                  className="bg-blue-500 h-4 rounded-full"
                  style={{ width: `${(option.votes_count ?? 0) * 10}%` }}
                ></div>
              </div>
              <span className="text-gray-500">
                {option.votes_count ?? 0} votes
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div></div>
      <div className="mt-5 text-center text-gray-500">
        <p>Created by User ID: {pollData?.user_id}</p>
        <p>
          Created at:{" "}
          {pollData?.created_at
            ? new Date(pollData.created_at).toLocaleString()
            : "N/A"}
        </p>
        <p>Status: {pollData?.is_active ? "Active" : "Inactive"}</p>
      </div>
      <div>
        <Chart series={series} labels={labels} />
      </div>
      <div>
        <Vote pollId={id} pollOptions={pollData.options} />
      </div>
    </div>
  );
};

export default Page;
