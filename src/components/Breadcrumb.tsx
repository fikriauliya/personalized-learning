interface Props {
  items: { title: string; id: string }[]
  onNavigate: (id: string) => void
}

export default function Breadcrumb({ items, onNavigate }: Props) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-8 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <svg className="w-3.5 h-3.5 text-slate-300 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {i < items.length - 1 ? (
            <button
              onClick={() => onNavigate(item.id)}
              className="text-slate-400 hover:text-brand-600 transition-colors duration-200 hover:underline decoration-brand-300 underline-offset-2"
            >
              {item.title}
            </button>
          ) : (
            <span className="text-slate-700 font-semibold">{item.title}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
