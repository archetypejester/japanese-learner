import { PracticeView } from './components/PracticeView'
import { SelectionGrid } from './components/SelectionGrid'
import { useKanaStore } from './store/useKanaStore'

function App() {
  const currentView = useKanaStore((state) => state.currentView)

  if (currentView === 'practice') {
    return <PracticeView />
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold">Japanese Learner</h1>
        <p className="mb-6 text-slate-600">Choose the kana you want to practice.</p>
        <SelectionGrid />
      </div>
    </main>
  )
}

export default App
