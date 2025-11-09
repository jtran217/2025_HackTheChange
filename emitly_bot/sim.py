import requests
import time
from datetime import datetime, timedelta
from rich.console import Console
from rich.panel import Panel

API_URL = "http://0.0.0.0:3000/userEmissions?user_id=31f2afa1-3fec-4a56-a2cb-5ea05ded50fe"

console = Console()


def get_dates():
    """Return yesterday and the day before yesterday as YYYY-MM-DD strings."""
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    day_before = today - timedelta(days=2)
    return str(yesterday), str(day_before)


def fetch_emission_history():
    """Fetch user CO₂ data from the API."""
    try:
        r = requests.get(API_URL, timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        console.print(f"[red]Error fetching data: {e}[/red]")
        return []


def compute_trend(data):
    """Return trend based on yesterday vs. day before."""
    yesterday, day_before = get_dates()

    lookup = {item["date"]: item["predicted_emission"] for item in data if "date" in item}

    y_val = lookup.get(yesterday)
    p_val = lookup.get(day_before)

    console.print(f"\n[bold cyan]Testing Data Comparison:[/bold cyan]")
    console.print(f"  Yesterday ({yesterday}): {y_val}")
    console.print(f"  Day Before ({day_before}): {p_val}")

    if y_val is None or p_val is None:
        console.print("[yellow]Not enough data for comparison[/yellow]")
        return 0

    # Improvement = lower emission
    if y_val < p_val:
        return 1
    elif y_val > p_val:
        return -1
    else:
        return 0


def simulate_display(trend):
    """Print colored feedback in terminal."""
    if trend > 0:
        color = "green"
        msg = "✅ Great job! Your emissions improved since yesterday!"
        spin = "normal"
    elif trend < 0:
        color = "red"
        msg = "⚠️ Emissions increased. Try improving your habits!"
        spin = "slow"
    else:
        color = "yellow"
        msg = "No significant change detected or missing data."
        spin = "idle"

    console.print()
    console.print(
        Panel(f"[bold white]{msg}[/bold white]\nMotor Speed: {spin.upper()}",
              style=color)
    )


def main():
    while True:
        data = fetch_emission_history()
        trend = compute_trend(data)
        simulate_display(trend)
        time.sleep(10)  # refresh every 10 seconds


if __name__ == "__main__":
    main()