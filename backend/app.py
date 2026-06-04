from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(BASE_DIR, '..', 'modelo_agencia_dn.pkl'))
encoders = joblib.load(os.path.join(BASE_DIR, '..', 'encoders.pkl'))

CATEGORY_MAPPINGS = {
    'Tipo_Servicio': ['Página Web', 'Sistema Web', 'Tienda Virtual'],
    'Canal_Contacto': ['Facebook', 'Instagram', 'TikTok', 'Web', 'WhatsApp'],
    'Tipo_Cliente': ['Empresa', 'Persona'],
    'Ubicacion_Cliente': ['Arequipa', 'Cusco', 'Lima', 'Piura', 'Trujillo'],
    'Urgencia_Proyecto': ['Alta', 'Baja', 'Media'],
    'Experiencia_Previa': ['No', 'Sí'],
    'Tamano_Proyecto': ['Grande', 'Mediano', 'Pequeño'],
}

FEATURE_ORDER = [
    'Tipo_Servicio', 'Presupuesto_Cliente', 'Tiempo_Respuesta_Horas',
    'Canal_Contacto', 'Numero_Consultas', 'Tipo_Cliente',
    'Ubicacion_Cliente', 'Urgencia_Proyecto', 'Cantidad_Reuniones',
    'Experiencia_Previa', 'Tiempo_Decision_Dias', 'Tamano_Proyecto'
]

@app.route('/api/categories', methods=['GET'])
def get_categories():
    result = {}
    for col, values in CATEGORY_MAPPINGS.items():
        result[col] = values
    return jsonify(result)

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        features = []
        for col in FEATURE_ORDER:
            val = data.get(col)
            if val is None:
                return jsonify({'error': f'Missing field: {col}'}), 400
            if col in CATEGORY_MAPPINGS:
                mapping = {name: i for i, name in enumerate(CATEGORY_MAPPINGS[col])}
                features.append(mapping[val])
            else:
                features.append(float(val))

        X = np.array(features).reshape(1, -1)
        pred = model.predict(X)[0]
        proba = model.predict_proba(X)[0]
        proba_contrata = float(proba[1]) if len(proba) > 1 else float(proba[0])

        return jsonify({
            'prediccion': 'Sí' if pred == 1 else 'No',
            'probabilidad': proba_contrata,
            'codigo': int(pred)
        })
    except ValueError as e:
        return jsonify({'error': f'Invalid value: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
