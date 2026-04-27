from flask import Flask, jsonify

# Initialize the Admin Backend System
app = Flask(__name__)

@app.route('/admin/health', methods=['GET'])
def health_check():
    """
    Core health check endpoint for the Admin Dashboard.
    Used by the deployment system to verify service status.
    """
    return jsonify({
        "status": "online",
        "system": "Campus Task Admin Backend",
        "version": "v1.0.0",
        "message": "Admin service is running properly."
    })

if __name__ == '__main__':
    # Run the admin backend on an independent port
    app.run(host='0.0.0.0', port=8081, debug=True)
