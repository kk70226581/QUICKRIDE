function Heading({title, subtitle}) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-dark-900 mb-2">{title}</h1>
      {subtitle && <p className="text-dark-600 text-sm sm:text-base">{subtitle}</p>}
    </div>
  )
}

export default Heading
