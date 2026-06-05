import { useState, useEffect, useRef } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'

const FIELDS = [
  { key: 'Tipo_Servicio', label: 'Tipo de Servicio',  type: 'select' },
  { key: 'Presupuesto_Cliente', label: 'Presupuesto (S/)', type: 'number', min: 0, max: 999999, step: 1 },
  { key: 'Tiempo_Respuesta_Horas', label: 'Tiempo Respuesta (horas)', type: 'number', min: 0, max: 999, step: 1 },
  { key: 'Canal_Contacto', label: 'Canal de Contacto', type: 'select' },
  { key: 'Numero_Consultas', label: 'N\u00famero de Consultas', type: 'number', min: 0, max: 999, step: 1 },
  { key: 'Tipo_Cliente', label: 'Tipo de Cliente', type: 'select' },
  { key: 'Ubicacion_Cliente', label: 'Ubicaci\u00f3n', type: 'select' },
  { key: 'Urgencia_Proyecto', label: 'Urgencia del Proyecto', type: 'select' },
  { key: 'Cantidad_Reuniones', label: 'Cant. Reuniones', type: 'number', min: 0, max: 999, step: 1 },
  { key: 'Experiencia_Previa', label: 'Experiencia Previa', type: 'select' },
  { key: 'Tiempo_Decision_Dias', label: 'Tiempo Decisi\u00f3n (d\u00edas)', type: 'number', min: 0, max: 9999, step: 1 },
  { key: 'Tamano_Proyecto', label: 'Tama\u00f1o del Proyecto', type: 'select' },
]

function App() {
  const [categories, setCategories] = useState({})
  const [form, setForm] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const resultRef = useRef(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const getDefaults = (data) => {
    const defaults = {}
    for (const [key, values] of Object.entries(data)) {
      defaults[key] = values[0]
    }
    FIELDS.filter(f => f.type === 'number').forEach(f => { defaults[f.key] = '' })
    return defaults
  }

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(data)
        setForm(getDefaults(data))
      })
      .catch(() => setError('No se pudo conectar con el servidor.'))
  }, [])

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleClear = () => {
    setForm(getDefaults(categories))
    setResult(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        setHistory(prev => [{ ...form, resultado: data.prediccion, probabilidad: data.probabilidad, fecha: new Date() }, ...prev].slice(0, 5))
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
      } else {
        setError(data.error || 'Error en la prediccion')
      }
    } catch {
      setError('Error de conexi\u00f3n con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  if (!form.Tipo_Servicio) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Conectando con el servidor...</p>
      </div>
    )
  }

  return (
    <div className="page">
      <button className="theme-toggle" onClick={() => setDark(prev => !prev)} title="Cambiar modo">
        {dark ? '\u2600\uFE0F' : '\u{1F319}'}
      </button>
      <header className="hero">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <div className="hero-badge">ML Predictor v1.0</div>
          <h1>Prediccion de Contratacion</h1>
          <p className="hero-sub">Ingrese los datos del cliente y obtenga una prediccion basada en Machine Learning</p>
          <div className="hero-stats">
            <div className="stat"><span className="stat-num">12</span><span className="stat-lbl">Variables</span></div>
            <div className="stat"><span className="stat-num">85%</span><span className="stat-lbl">Precisi\u00f3n</span></div>
            <div className="stat"><span className="stat-num">Logistic</span><span className="stat-lbl">Modelo</span></div>
          </div>
        </div>
      </header>

      <main className="main">
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-head">
              <span className="card-badge">Formulario</span>
              <h2>Datos del Cliente</h2>
              <p>Complete todos los campos para realizar la prediccion</p>
            </div>
            <div className="fields-grid">
              {FIELDS.map(({ key, label, icon, type, min, max, step }) => (
                <div className={`field ${type === 'select' ? 'field-select' : ''}`} key={key}>
                  <label>
                    <span className="field-icon">{icon}</span>
                    {label}
                  </label>
                  {type === 'select' ? (
                    <div className="input-wrap">
                      <select value={form[key] || ''} onChange={e => handleChange(key, e.target.value)}>
                        {(categories[key] || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="input-wrap">
                      <input
                        type="number"
                        value={form[key] || ''}
                        min={min} max={max} step={step}
                        placeholder="0"
                        onChange={e => handleChange(key, e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner-btn"></span> Prediciendo...</> : <> Predecir</>}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleClear}>
               Borrar datos
            </button>
          </div>
        </form>

        {error && <div className="error"><span className="err-icon">\u26A0\uFE0F</span> {error}</div>}

        <div ref={resultRef}>
          {result && (
            <div className={`result result-${result.codigo === 1 ? 'yes' : 'no'}`}>
              <div className="result-glow"></div>
              <div className="result-icon-wrap">{result.codigo === 1 ? '\u2705' : '\u274C'}</div>
              <h2 className="result-title">
                {result.prediccion === 'S\u00ed'
                  ? 'S\u00cd contratar\u00e1 el servicio'
                  : 'NO contratar\u00e1 el servicio'}
              </h2>
              <div className="result-prob">
                <span>Probabilidad</span>
                <strong>{(result.probabilidad * 100).toFixed(1)}%</strong>
              </div>
              <div className="prob-track">
                <div className="prob-fill" style={{ width: `${(result.probabilidad * 100).toFixed(1)}%` }}></div>
              </div>
              <p className="result-foot">Modelo Logistic Regression con 85% de precisi\u00f3n</p>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="card history-card">
            <div className="card-head">
              <span className="card-badge">Historial</span>
              <h2>{'\u{1F4CB}'} \ultimas predicciones</h2>
            </div>
            <div className="history-list">
              {history.map((h, i) => (
                <div key={i} className={`history-item ${h.resultado === 'S\u00ed' ? 'h-yes' : 'h-no'}`}>
                  <span className="h-icon">{h.resultado === 'S\u00ed' ? '\u2705' : '\u274C'}</span>
                  <span className="h-info">
                    {h.Tipo_Servicio} &middot; S/{h.Presupuesto_Cliente || '?'} &middot; {h.Tipo_Cliente}
                  </span>
                  <span className="h-prob">{(h.probabilidad * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Proyecto ML &mdash; Predicci&oacute;n de contrataci&oacute;n de servicios</p>
      </footer>
    </div>
  )
}

export default App
