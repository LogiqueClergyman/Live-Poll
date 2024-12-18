import axios from "axios";

type Poll = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
};

import Link from "next/link";

const Home = async () => {
  const response = await axios.get("http://localhost:8080/api/polls/");
  const polls: Poll[] = response.data;
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Polls</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {polls.map((poll) => (
          <Link key={poll.id} href={`/polls/${poll.id}`} className="hover:shadow-md">
            <PollItem poll={poll} />
          </Link>
        ))}
      </ul>
    </div>
  );
};

const PollItem = ({ poll }: { poll: Poll }) => {
  return (
    <li className="bg-white shadow-md rounded-lg p-4 cursor-pointer">
      <h2 className="text-xl font-semibold mb-2">{poll.title}</h2>
      <p className="text-gray-700 mb-2">{poll.description}</p>
      <p className="text-gray-500 mb-2">
        Active: {poll.is_active ? "Yes" : "No"}
      </p>
      <p className="text-gray-500">
        Created at: {new Date(poll.created_at).toLocaleString()}
      </p>
    </li>
  );
};

export default Home;
