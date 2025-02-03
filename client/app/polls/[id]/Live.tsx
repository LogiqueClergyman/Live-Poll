import React, { useEffect, useState } from "react";

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  votes_count: number | null;
}
interface PollResults {
  poll: string;
  percentage: [string, number][];
  total_votes: number;
  winner: string;
  runnerUp: string;
  options: PollOption[];
}
function Live({ pollId }: { pollId: string }) {
  const [pollResults, setPollResults] = useState<PollResults | null>(null);
  useEffect(() => {
    if (!pollId) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/api/polls/${pollId}/results`
    );

    const handleMessage = (event: MessageEvent) => {
      const updatedData = JSON.parse(event.data);
      //   console.log(updatedData);
      setPollResults(updatedData);
      console.log("asdadasdas", updatedData?.total_votes);
    };

    eventSource.onmessage = handleMessage;
    eventSource.onerror = (error) => {
      console.error("Error with SSE:", error);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [pollId]);

  return (
    <div>
      <div className="">
        <h2 className="text-2xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-4">
          Live Results
        </h2>
        <div className="max-w-2xl mx-auto">
          {pollResults?.options
            .sort((a, b) => (b.votes_count ?? 0) - (a.votes_count ?? 0))
            .map((option) => {
              const votePercentage =
                pollResults.total_votes > 0
                  ? ((option.votes_count ?? 0) / pollResults.total_votes) * 100
                  : 0;
              console.log(votePercentage);
              return (
                <div
                  key={option.id}
                  className="mb-6 group hover:transform hover:scale-[1.01] transition-all duration-300"
                >
                  <div className="flex justify-between items-center text-gray-300 mb-2">
                    <span className="text-base font-medium tracking-wide">
                      {option.option_text}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold bg-gray-800 px-3 py-1 rounded-full">
                        {option.votes_count ?? 0} votes
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-800/50 border rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500 ease-out shadow-lg shadow-blue-500/20"
                      style={{
                        width: `${votePercentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default Live;
