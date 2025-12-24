from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

CONFIG_FILE = "config.json"
LEADER_FILE = "leaderboard.json"

# ---------- LOAD FILE ----------
def load_json(path):
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ---------- ROUTES ----------
@app.route("/")
def index():
    config = load_json(CONFIG_FILE)
    leaderboard = load_json(LEADER_FILE)
    return render_template(
        "index.html",
        config=config,
        leaderboard=leaderboard
    )

@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    return jsonify(load_json(LEADER_FILE))

@app.route("/api/leaderboard", methods=["POST"])
def update_leaderboard():
    data = request.json
    leaderboard = load_json(LEADER_FILE)

    name = data.get("player")
    money = data.get("money")

    existing = leaderboard.get(name)

    # nếu là người cũ → update điểm
    leaderboard[name] = money
    save_json(LEADER_FILE, leaderboard)
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    # Render sẽ tự set PORT
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
