import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import celebrationGif from './assets/thumbs-up.gif'

// Basisset woorden voor dit eerste dictee-thema.
const WORD_LISTS: Record<string, string[]> = {
  'Nederlandse wateren': [
    'Waddenzee',
    'IJsselmeer',
    'Markermeer',
    'IJssel',
    'Nederrijn',
    'Waal',
    'Maas',
    'Noordzeekanaal',
    'Amsterdam-Rijnkanaal',
    'Lek',
    'Nieuwe Waterweg',
    'Oosterschelde',
    'Westerschelde',
  ],
  'Bekende artiesten': [
    'The Weeknd',
    'Billie Eilish',
    'Taylor Swift',
    'Drake',
    'Ariana Grande',
    'Post Malone',
    'Dua Lipa',
    'Kanye West',
    'Travis Scott',
    'Harry Styles',
    'Olivia Rodrigo',
    'Shakira',
    'Bad Bunny',
    'Kendrick Lamar',
    'Lady Gaga',
    'Ed Sheeran',
    'Rihanna',
    'Justin Bieber',
  ],
}

const PRESET_QUESTION_COUNTS = [5, 10, 15, 20, 30]
const WORD_LIST_NAMES = Object.keys(WORD_LISTS)
const LOCALE = 'nl-NL'

type LetterState = 'correct' | 'wrong' | 'missing' | 'extra'

type LetterFeedback = {
  expected?: string
  actual?: string
  state: LetterState
}
type Step = 'diag' | 'up' | 'left' | null

const normalize = (value: string) =>
  value.toLocaleLowerCase(LOCALE).trim().replace(/\s+/g, ' ')

const isSameChar = (a: string, b: string) =>
  a.toLocaleLowerCase(LOCALE) === b.toLocaleLowerCase(LOCALE)

const isCorrectAnswer = (answer: string, target: string) =>
  normalize(answer) === normalize(target)

const charLabel = (char: string) => {
  if (char === ' ') {
    return 'spatie'
  }
  return char
}

const shuffleWords = (words: string[]) => {
  const result = [...words]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const buildFeedback = (answer: string, target: string): LetterFeedback[] => {
  // Edit-distance met expliciete operatiekeuze.
  // Substitutie is duurder dan insert/delete, zodat verschuivingen als missing/extra worden gezien.
  const answerChars = [...answer.trim()]
  const targetChars = [...target]
  const rows = targetChars.length
  const cols = answerChars.length

  const cost: number[][] = Array.from({ length: rows + 1 }, () =>
    Array.from({ length: cols + 1 }, () => 0),
  )
  const parent: Step[][] = Array.from(
    { length: rows + 1 },
    () => Array.from({ length: cols + 1 }, () => null),
  )

  for (let i = 1; i <= rows; i += 1) {
    cost[i][0] = cost[i - 1][0] + 1
    parent[i][0] = 'up'
  }
  for (let j = 1; j <= cols; j += 1) {
    cost[0][j] = cost[0][j - 1] + 1
    parent[0][j] = 'left'
  }

  for (let i = 1; i <= rows; i += 1) {
    for (let j = 1; j <= cols; j += 1) {
      const expected = targetChars[i - 1]
      const actual = answerChars[j - 1]
      const same = isSameChar(expected, actual)

      const diagCost = cost[i - 1][j - 1] + (same ? 0 : 2)
      const upCost = cost[i - 1][j] + 1
      const leftCost = cost[i][j - 1] + 1

      const best = Math.min(diagCost, upCost, leftCost)
      cost[i][j] = best

      // Tie-break:
      // 1) perfecte match diag
      // 2) missing (up)
      // 3) extra (left)
      // 4) substitutie/wrong diag
      if (same && diagCost === best) {
        parent[i][j] = 'diag'
      } else if (upCost === best) {
        parent[i][j] = 'up'
      } else if (leftCost === best) {
        parent[i][j] = 'left'
      } else {
        parent[i][j] = 'diag'
      }
    }
  }

  const feedback: LetterFeedback[] = []
  let i = rows
  let j = cols

  while (i > 0 || j > 0) {
    const step = parent[i][j]

    if (step === 'up' && i > 0) {
      feedback.push({
        expected: targetChars[i - 1],
        state: 'missing',
      })
      i -= 1
      continue
    }

    if (step === 'left' && j > 0) {
      feedback.push({
        actual: answerChars[j - 1],
        state: 'extra',
      })
      j -= 1
      continue
    }

    if (i > 0 && j > 0) {
      const expected = targetChars[i - 1]
      const actual = answerChars[j - 1]
      const same = isSameChar(expected, actual)

      feedback.push({
        expected,
        actual,
        state: same ? 'correct' : 'wrong',
      })
      i -= 1
      j -= 1
      continue
    }

    if (i > 0) {
      feedback.push({
        expected: targetChars[i - 1],
        state: 'missing',
      })
      i -= 1
      continue
    }

    if (j > 0) {
      feedback.push({
        actual: answerChars[j - 1],
        state: 'extra',
      })
      j -= 1
    }
  }

  feedback.reverse()
  return feedback
}

const pickDutchFemaleVoice = (voices: SpeechSynthesisVoice[]) => {
  // Browservoices verschillen per OS/browser. We scoren op NL + naam-hints.
  const dutchVoices = voices.filter((voice) =>
    voice.lang.toLocaleLowerCase().startsWith('nl'),
  )

  if (dutchVoices.length === 0) {
    return null
  }

  const femaleHints = [
    'female',
    'vrouw',
    'woman',
    'colette',
    'hanna',
    'xenia',
    'sofie',
    'claire',
    'anouk',
  ]
  const maleHints = ['male', 'man', 'frank', 'david']

  const scored = dutchVoices.map((voice) => {
    const name = voice.name.toLocaleLowerCase()
    let score = 0

    if (femaleHints.some((hint) => name.includes(hint))) {
      score += 3
    }
    if (maleHints.some((hint) => name.includes(hint))) {
      score -= 3
    }
    if (voice.default) {
      score += 1
    }

    return { voice, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0].voice
}

function App() {
  const answerInputRef = useRef<HTMLInputElement>(null)
  // Game state.
  const [round, setRound] = useState(1)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [currentWord, setCurrentWord] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [roundCorrect, setRoundCorrect] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [mistakeCount, setMistakeCount] = useState<Record<string, number>>({})
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastFeedback, setLastFeedback] = useState<LetterFeedback[]>([])
  const [lastResultCorrect, setLastResultCorrect] = useState<boolean | null>(null)
  const [lastAttempt, setLastAttempt] = useState('')
  const [lastCorrectWord, setLastCorrectWord] = useState('')
  const [questionsPerRound, setQuestionsPerRound] = useState(10)
  const [customQuestionCount, setCustomQuestionCount] = useState('')
  const [roundMistakes, setRoundMistakes] = useState<
    { word: string; answer: string; feedback: LetterFeedback[] }[]
  >([])
  const [showMistakes, setShowMistakes] = useState(false)
  const [activeWordListKey, setActiveWordListKey] = useState(WORD_LIST_NAMES[0])
  const activeWordList = useMemo(
    () => WORD_LISTS[activeWordListKey],
    [activeWordListKey],
  )
  const pendingRef = useRef<string[]>([])

  const speechSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  // Totaalpercentage over alle gespeelde vragen.
  const accuracy = useMemo(() => {
    if (totalQuestions === 0) {
      return 0
    }
    return Math.round((totalCorrect / totalQuestions) * 100)
  }, [totalCorrect, totalQuestions])

  const speakText = (text: string, rate: number, pitch: number) => {
    if (!speechSupported) {
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    const dutchVoice = pickDutchFemaleVoice(window.speechSynthesis.getVoices())

    if (dutchVoice) {
      utterance.voice = dutchVoice
    }

    utterance.lang = dutchVoice?.lang ?? LOCALE
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    // Stop eventuele vorige utterance zodat herhaal-knoppen niet overlappen.
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const speakWord = (word: string) => {
    speakText(word, 0.85, 1.05)
  }

  const speakCelebration = () => {
    speakText('Goed gedaan!', 0.95, 1.15)
  }

  const resetRoundUi = () => {
    setRoundCorrect(0)
    setLastFeedback([])
    setLastResultCorrect(null)
    setLastAttempt('')
    setLastCorrectWord('')
    setRoundMistakes([])
    setShowMistakes(false)
  }

  const drawNextWord = (currentMistakes: Record<string, number>) => {
    let pool = pendingRef.current
    if (pool.length === 0) {
      const mistakeWords = Object.entries(currentMistakes)
        .filter(([, count]) => count > 0)
        .map(([word]) => word)
      const base = mistakeWords.length > 0 ? mistakeWords : activeWordList
      pool = shuffleWords(base)
    }

    const [nextWord, ...rest] = pool
    pendingRef.current = rest
    return nextWord ?? activeWordList[0]
  }

  const startRound = () => {
    const firstWord = drawNextWord(mistakeCount)

    setQuestionNumber(1)
    setCurrentWord(firstWord)
    setAnswer('')
    resetRoundUi()
    speakWord(firstWord)
  }

  const goToStartScreen = () => {
    if (speechSupported) {
      window.speechSynthesis.cancel()
    }

    setQuestionNumber(0)
    setCurrentWord(null)
    setAnswer('')
    resetRoundUi()
    setIsSpeaking(false)
    pendingRef.current = []
  }

  const handleWordListChange = (key: string) => {
    setActiveWordListKey(key)
    goToStartScreen()
  }

  const applyCustomQuestionCount = () => {
    const parsed = Number.parseInt(customQuestionCount, 10)
    if (Number.isNaN(parsed)) {
      return
    }

    const clamped = Math.min(100, Math.max(1, parsed))
    setQuestionsPerRound(clamped)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!currentWord) {
      return
    }

    const correct = isCorrectAnswer(answer, currentWord)
    const feedback = buildFeedback(answer, currentWord)

    setLastFeedback(feedback)
    setLastResultCorrect(correct)
    setLastAttempt(answer.trim())
    setLastCorrectWord(currentWord)
    setTotalQuestions((previous) => previous + 1)

    if (!correct) {
      setRoundMistakes((previous) => [
        ...previous,
        { word: currentWord, answer: answer.trim(), feedback },
      ])
    }

    // Snapshot wordt meteen gebruikt voor de volgende gewogen selectie.
    let nextMistakeCount = mistakeCount

    if (correct) {
      setRoundCorrect((previous) => previous + 1)
      setTotalCorrect((previous) => previous + 1)
      nextMistakeCount = { ...mistakeCount }
      delete nextMistakeCount[currentWord]
    } else {
      nextMistakeCount = {
        ...mistakeCount,
        [currentWord]: (mistakeCount[currentWord] ?? 0) + 1,
      }
    }

    setMistakeCount(nextMistakeCount)

    if (questionNumber >= questionsPerRound) {
      // Einde ronde: geen nieuw woord meer klaarzetten.
      setQuestionNumber(questionsPerRound)
      setCurrentWord(null)
      setAnswer('')
      speakCelebration()
      return
    }

    const nextWord = drawNextWord(nextMistakeCount)

    if (!nextWord) {
      setCurrentWord(null)
      return
    }

    setQuestionNumber((previous) => previous + 1)
    setCurrentWord(nextWord)
    setAnswer('')

    speakWord(nextWord)
  }

  const startNextRound = () => {
    setRound((previous) => previous + 1)
    startRound()
  }

  const roundFinished = questionNumber >= questionsPerRound && currentWord === null

  // Houd focus op het invoerveld tijdens actief dictee.
  useEffect(() => {
    if (currentWord) {
      answerInputRef.current?.focus()
    }
  }, [currentWord])

  return (
    <main className="app-shell">
      <div className="decor decor-left" />
      <div className="decor decor-right" />

      <section className="card">
        <div className="top-actions">
          <button className="btn secondary" onClick={goToStartScreen} type="button">
            Terug naar begin
          </button>
        </div>
        <h1>Dictee: {activeWordListKey}</h1>
        <p className="subtitle">Luister goed, typ het woord en check je spelling per letter.</p>

        <div className="stats">
          <div>
            <span className="label">Ronde</span>
            <strong>{round}</strong>
          </div>
          <div>
            <span className="label">Vraag</span>
            <strong>
              {questionNumber === 0 ? 0 : Math.min(questionNumber, questionsPerRound)} / {questionsPerRound}
            </strong>
          </div>
          <div>
            <span className="label">Score</span>
            <strong>
              {totalCorrect} / {totalQuestions}
            </strong>
          </div>
          <div>
            <span className="label">Nauwkeurig</span>
            <strong>{accuracy}%</strong>
          </div>
        </div>

        {questionNumber === 0 && (
          <div className="center-block">
            <p className="help">Druk op start en luister naar de uitgesproken waterweg.</p>
            <div className="list-picker">
              {WORD_LIST_NAMES.map((key) => (
                <button
                  key={key}
                  className={`btn choice ${activeWordListKey === key ? 'active' : ''}`}
                  type="button"
                  onClick={() => handleWordListChange(key)}
                >
                  {key}
                </button>
              ))}
            </div>
            <div className="question-picker">
              {PRESET_QUESTION_COUNTS.map((count) => (
                <button
                  key={count}
                  className={`btn choice ${questionsPerRound === count ? 'active' : ''}`}
                  onClick={() => setQuestionsPerRound(count)}
                  type="button"
                >
                  {count}
                </button>
              ))}
            </div>
            <div className="custom-question-picker">
              <label htmlFor="custom-count">Eigen aantal vragen</label>
              <input
                id="custom-count"
                type="number"
                min={1}
                max={100}
                value={customQuestionCount}
                onChange={(event) => setCustomQuestionCount(event.target.value)}
                placeholder="Bijv. 12"
              />
              <button className="btn secondary" onClick={applyCustomQuestionCount} type="button">
                Gebruik aantal
              </button>
            </div>
            <p className="help">Nu ingesteld: {questionsPerRound} vragen per ronde.</p>
            <button className="btn primary" onClick={startRound}>
              Start dictee
            </button>
          </div>
        )}

        {currentWord && (
          <>
            <div className="speak-row">
              <button
                className="btn secondary"
                onClick={() => {
                  speakWord(currentWord)
                  answerInputRef.current?.focus()
                }}
              >
                {isSpeaking ? 'Aan het voorlezen...' : 'Lees het woord opnieuw voor'}
              </button>
              {!speechSupported && <p className="warn">Je browser ondersteunt geen voorleesfunctie.</p>}
            </div>

            <form className="answer-form" onSubmit={handleSubmit}>
              <label htmlFor="answer">Typ de waterweg:</label>
              <input
                ref={answerInputRef}
                id="answer"
                autoComplete="off"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Bijv. Waddenzee"
                required
              />
              <button className="btn primary" type="submit">
                Controleer
              </button>
            </form>
          </>
        )}

        {lastResultCorrect !== null && (
          <section className="feedback">
            <h2>{lastResultCorrect ? 'Goed gedaan!' : 'Bijna, probeer de volgende!'}</h2>
            {!lastResultCorrect && (
              <p className="word-compare">
                <strong>Jij typte:</strong> {lastAttempt || '(leeg)'}
                <br />
                <strong>Goed is:</strong> {lastCorrectWord}
              </p>
            )}
            <div className="letter-grid">
              {lastFeedback.map((item, index) => (
                <span key={`${item.expected ?? item.actual}-${index}`} className={`letter ${item.state}`}>
                  {item.state === 'extra' && item.actual ? `+ ${charLabel(item.actual)}` : null}
                  {item.state === 'missing' && item.expected ? `? ${charLabel(item.expected)}` : null}
                  {(item.state === 'correct' || item.state === 'wrong') && item.expected
                    ? charLabel(item.expected)
                    : null}
                </span>
              ))}
            </div>
            <p className="legend">
              <span className="chip correct">Goed</span>
              <span className="chip wrong">Fout</span>
              <span className="chip missing">Mist</span>
              <span className="chip extra">Extra</span>
            </p>
          </section>
        )}

        {roundFinished && (
        <section className="round-end">
            <img
              className="celebration-gif"
              src={celebrationGif}
              alt="Enthousiaste thumbs up"
            />
            <p className="mascot-text">Goed gedaan!</p>
            <h2>Ronde klaar!</h2>
            <p>
              Je had {roundCorrect} van de {questionsPerRound} goed.
            </p>
            <p className="help">Woorden die fout gingen komen straks vaker terug.</p>
            {roundMistakes.length > 0 && (
              <>
                <button
                  className="btn secondary"
                  type="button"
                  onClick={() => setShowMistakes((previous) => !previous)}
                >
                  {showMistakes ? 'Verberg fouten' : 'Bekijk fouten'}
                </button>
                {showMistakes && (
                <div className="mistakes-panel">
                  {roundMistakes.map((mistake, index) => (
                    <article key={`${mistake.word}-${index}`}>
                        <h3>
                          {mistake.word} ← {mistake.answer || '(leeg)'}
                        </h3>
                        <div className="letter-grid compact">
                          {mistake.feedback.map((item, idx) => (
                            <span
                              key={`${item.expected ?? item.actual}-${idx}`}
                              className={`letter ${item.state}`}
                            >
                              {item.state === 'extra' && item.actual
                                ? `+ ${charLabel(item.actual)}`
                                : null}
                              {item.state === 'missing' && item.expected
                                ? `? ${charLabel(item.expected)}`
                                : null}
                              {(item.state === 'correct' || item.state === 'wrong') &&
                              item.expected
                                ? charLabel(item.expected)
                                : null}
                            </span>
                          ))}
                        </div>
                      </article>
                    ))}
                    <p className="legend legend-inline">
                      <span className="chip correct">Goed</span>
                      <span className="chip wrong">Fout</span>
                      <span className="chip missing">Mist</span>
                      <span className="chip extra">Extra</span>
                    </p>
                  </div>
                )}
              </>
            )}
            <div className="round-end-actions">
              <button className="btn secondary" onClick={speakCelebration} type="button">
                Zeg het nog eens
              </button>
              {!speechSupported && (
                <p className="warn">Deze browser ondersteunt geen voorleesfunctie.</p>
              )}
            </div>
            <button className="btn primary" onClick={startNextRound}>
              Nieuwe ronde
            </button>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
