import Link from "next/link";
import axios from "axios";

type Poll = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
};

const Home = async () => {
  let polls: Poll[] = [];
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/polls/`
    );
    polls = response.data;
  } catch (error) {
    console.error(error);
  }
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400 text-center">
        Live Polls
      </h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {polls.map((poll) => (
          <Link
            key={poll.id}
            href={`/polls/${poll.id}`}
            className="transform transition-all duration-300"
          >
            <PollItem poll={poll} />
          </Link>
        ))}
      </ul>
    </div>
  );
};

const PollItem = ({ poll }: { poll: Poll }) => {
  return (
    <li className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 hover:-translate-y-1 hover:scale-[1.02] hover:border-cyan-400/30 shadow-lg shadow-black/20 transition-all duration-500 ease-out h-[280px] flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 line-clamp-1">
          {poll.title}
        </h2>
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full ${
              poll.is_active ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
            }`}
          />
          <p className="text-sm font-light tracking-wide">
            {poll.is_active ? "Active" : "Closed"}
          </p>
        </div>
      </div>

      <p className="text-gray-300/90 text-sm leading-relaxed mb-4 flex-grow line-clamp-3 font-light">
        {poll.description}
      </p>

      <div className="mt-auto border-t border-gray-700/30 pt-4">
        <p className="text-xs text-gray-400/80 flex items-center">
          <span className="w-1 h-1 rounded-full bg-cyan-400/50 mr-2" />
          {new Date(poll.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </li>
  );
};

export default Home;
