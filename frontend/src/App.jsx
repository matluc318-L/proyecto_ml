import { useState, useEffect } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'

const CATEGORICAL_FIELDS = [
  { key: 'Tipo_Servicio', label: 'Tipo de Servicio' },
  { key: 'Canal_Contacto', label: 'Canal de Contacto' },
  { key: 'Tipo_Cliente', label: 'Tipo de Cliente' },
  { key: 'Ubicacion_Cliente', label: 'Ubicación del Cliente' },
  { key: 'Urgencia_Proyecto', label: 'Urgencia del Proyecto' },
  { key: 'Experiencia_Previa', label: 'Experiencia Previa' },
  { key: 'Tamano_Proyecto', label: 'Tamaño del Proyecto' },
]

const NUMERIC_FIELDS = [
  { key: 'Presupuesto_Cliente', label: 'Presupuesto del Cliente (S/)', min: 0, max: 999999, step: 1 },
  { key: 'Tiempo_Respuesta_Horas', label: 'Tiempo de Respuesta (horas)', min: 0, max: 999, step: 1 },
  { key: 'Numero_Consultas', label: 'Número de Consultas', min: 0, max: 999, step: 1 },
  { key: 'Cantidad_Reuniones', label: 'Cantidad de Reuniones', min: 0, max: 999, step: 1 },
  { key: 'Tiempo_Decision_Dias', label: 'Tiempo de Decisión (días)', min: 0, max: 9999, step: 1 },
]

function App() {
  const [categories, setCategories] = useState({})
  const [form, setForm] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getDefaults = (data) => {
    const defaults = {}
    for (const [key, values] of Object.entries(data)) {
      defaults[key] = values[0]
    }
    for (const f of NUMERIC_FIELDS) {
      defaults[f.key] = ''
    }
    return defaults
  }

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(data)
        setForm(getDefaults(data))
      })
      .catch(() => setError('No se pudo conectar con el servidor'))
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
      } else {
        setError(data.error || 'Error en la predicción')
      }
    } catch {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  if (!form.Tipo_Servicio) {
    return (
      <div className="container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Conectando con el servidor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-icon">&#9670;</div>
        <h1>Predicción de Contrataci&oacute;n</h1>
        <p className="subtitle">Complete los datos del cliente para predecir si contratar&aacute; el servicio</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-title">
            <span className="card-icon">&#128203;</span>
            Datos del Cliente
          </div>
          <div className="fields-grid">
            {CATEGORICAL_FIELDS.map(({ key, label }) => (
              <div className="field" key={key}>
                <label>{label}</label>
                <div className="select-wrapper">
                  <select value={form[key] || ''} onChange={e => handleChange(key, e.target.value)}>
                    {(categories[key] || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {NUMERIC_FIELDS.map(({ key, label, min, max, step }) => (
              <div className="field" key={key}>
                <label>{label}</label>
                <input
                  type="number"
                  value={form[key] || ''}
                  min={min}
                  max={max}
                  step={step}
                  placeholder="Ingrese valor"
                  onChange={e => handleChange(key, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>
        </div>

        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="spinner-small"></span> Prediciendo...</> : 'Predecir'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleClear}>
            Borrar datos
          </button>
        </div>
      </form>

      {error && <div className="error"><span className="error-icon">&#9888;</span> {error}</div>}

      {result && (
        <div className={`result ${result.codigo === 1 ? 'yes' : 'no'}`}>
          <div className="result-icon">{result.codigo === 1 ? '\u2713' : '\u2717'}</div>
          <h2>{result.prediccion === 'Sí' ? 'S\u00cd contratar\u00e1 el servicio' : 'NO contratar\u00e1 el servicio'}</h2>
          <div className="probability-bar">
            <div
              className="probability-fill"
              style={{ width: `${(result.probabilidad * 100).toFixed(1)}%` }}
            ></div>
          </div>
          <p>Probabilidad: <strong>{(result.probabilidad * 100).toFixed(1)}%</strong></p>
        </div>
      )}
    </div>
  )
}

export default App
