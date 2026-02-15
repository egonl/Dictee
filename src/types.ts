export type LetterState = 'correct' | 'wrong' | 'missing' | 'extra';
export type LetterFeedback = {
  expected?: string;
  actual?: string;
  state: LetterState;
};
export type MistakeEntry = {
  word: string;
  answer: string;
  feedback: LetterFeedback[];
};
