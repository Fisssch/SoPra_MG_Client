'use client';

import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'], // Normal, semi-bold,  bold
});

export default function RulesPage() {
  const router = useRouter();

  return (
    <div
      className={`${poppins.className} min-h-screen flex flex-col items-center justify-center text-white text-center px-4 py-12`}
      style={{
        background: 'linear-gradient(to right, #8b0000 0%, #a30000 10%, #c7adc4 50%,#8cc9d7 70%, #367d9f 90%, #1a425a 100%)',
      }}
    >
      <h1
        className="text-6xl md:text-6xl font-extrabold mb-8!"
        style={{
          WebkitTextStroke: '2px transparent',
          background: 'linear-gradient(to right, #00b4d8, #ff1e00)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'white',
        }}
      >
        Game Rules
      </h1>

      <div className="w-full max-w-4xl bg-[rgba(70,90,110,0.55)] p-9! rounded-xl shadow-2xl text-left backdrop-blur-md space-y-6 text-lg mb-6! ">
      <div className="space-y-4!">
  <p>
    {"Welcome to "} 
    <strong>Codenames+</strong>
    {"! The goal is simple: guess all the words that belong to your team before the other team does. However, success isn't just about guessing — it's about communication, strategy, and teamwork!"}
  </p>

  <p>
    {"At the start of the game, a grid of 25 words is revealed. Each word could belong to the red team, the blue team, be neutral, or be the deadly black word. Only the "}
    <strong>Spymasters</strong> 
    {" know which words belong to which team. Their mission: to guide their teammates — the "}
    <strong>Field Operatives</strong> 
    {"— to correctly identify all their team's words."}
  </p>

  <p>
  {"Spymasters give a clue consisting of a "}
  <strong>single word</strong> 
  {" and a "}
  <strong>number</strong>
  {". The word hints at associations with multiple words on the board, while the number indicates how many related words the team should guess. For example, if the Spymaster says "}
  <em>Ocean 2</em>
  {", teammates might guess "}
  <em>{"Ship"}</em> 
  {" and "} 
  <em>{"Dolphin"}</em>
  {"."}
</p>

<p>
  {"Field Operatives discuss and decide which words match the clue. They can keep guessing until they either reach the number given or until they make a wrong guess. A wrong guess might reveal a neutral word (ending the turn), an opponent's word (helping the other team!), or the dangerous black word (instantly losing the game)."}
</p>

<p>
  {"Remember: the Spymaster must be extremely careful not to accidentally hint at the other team's words, neutral words, or — worst of all — the black word! Communication must stay strictly within the bounds of the clue; no gestures, facial expressions, or hints beyond the chosen word and number."}
</p>

<p>
  {"Teams alternate turns. The first team to uncover all their assigned words wins. If a team ever guesses the black word, they immediately lose, giving victory to the opponents!"}
</p>

<p className="font-bold text-center text-xl pt-4 text-white">
  Think fast, think creatively, and most of all — have fun with your team!
</p>
</div>
      </div>

      <button
        onClick={() => router.push('/mainpage')}
        className="mt-10 flex items-center gap-2 bg-blue-600 px-6 py-3 rounded-lg text-lg font-semibold text-white hover:bg-blue-700 transition-all shadow-md"
      >
        <FaArrowLeft /> Back to Main Page
      </button>
    </div>
  );
}
