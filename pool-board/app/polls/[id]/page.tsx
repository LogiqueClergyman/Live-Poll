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
    <div className="p-8 mx-auto min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-center text-3xl font-bold text-white mb-4">
          {pollData?.title}
        </h1>
        <p className="text-center text-gray-400 mb-8">
          {pollData?.description}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="col-span-2 bg-gray-800 rounded-lg p-6 shadow-lg lg:grid lg:grid-cols-2 gap-6">
            <div className="mb-8 lg:mb-0">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
              Voting Options
              </h2>
              <ul className="space-y-4">
              {pollData?.options.map((option) => (
                <li key={option.id} className="group">
                <div className="flex flex-col space-y-2">
                  <span className="font-medium text-gray-200">
                  {option.option_text}
                  </span>
                  <div className="relative w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-blue-600 transition-all duration-300 rounded-full"
                    style={{
                    width: `${(option.votes_count ?? 0) * 10}%`,
                    }}
                  />
                  </div>
                  <span className="text-sm text-gray-400">
                  {option.votes_count ?? 0} votes
                  </span>
                </div>
                </li>
              ))}
              </ul>
            </div>

            <div className="w-full min-h-[300px] lg:min-h-0">
              <Chart series={series} labels={labels} />
            </div>
            </div>

          <div className="bg-gray-100 rounded-lg shadow-lg">
            <Vote pollId={id} pollOptions={pollData.options} />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-lg text-center">
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-400">
            <div>
              <p className="font-medium">Created by</p>
              <p className="text-gray-300">User ID: {pollData?.user_id}</p>
            </div>
            <div>
              <p className="font-medium">Created at</p>
              <p className="text-gray-300">
                {pollData?.created_at
                  ? new Date(pollData.created_at).toLocaleString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="font-medium">Status</p>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  pollData?.is_active
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {pollData?.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
