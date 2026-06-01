function Heading({title, subtitle}) {
  return (
    <div className="mb-8">
      <h1 className="mb-2 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">{title}</h1>
      {subtitle && <p className="text-sm font-normal leading-6 text-slate-500 sm:text-base">{subtitle}</p>}
    </div>
  )
}

export default Heading
