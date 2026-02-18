interface Props {
  items: { title: string; id: string }[]
  onNavigate: (id: string) => void
}

export default function Breadcrumb({ items, onNavigate }: Props) {
  return (
    <nav className="flex items-center gap-1 text-sm text-slate-500 mb-6 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="mx-1">›</span>}
          {i < items.length - 1 ? (
            <button onClick={() => onNavigate(item.id)} className="hover:text-blue-600 transition">{item.title}</button>
          ) : (
            <span className="text-slate-800 font-medium">{item.title}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
