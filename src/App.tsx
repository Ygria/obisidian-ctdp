import { Clock } from "./components/Clock";

export function App() {
	return (
		<div className="bg-background-primary min-h-screen p-8">
			<header className="mb-8">
				<h1>CDTP</h1>
				<p className="text-text-muted text-ui-small">
					Welcome to your new app
				</p>
			</header>
			<Clock />

			<main className="space-y-6">
				<div className="bg-background-secondary p-4 rounded-m border border-background-modifier-border">
					<div className="text-ui-medium font-medium text-text-accent mb-2">
						Getting Started
					</div>
					<div className="text-text-normal text-ui-small">
						This is a sample card using your custom Tailwind tokens.
					</div>
				</div>

				<button className="bg-interactive-accent hover:bg-interactive-accent-hover text-text-on-accent px-4 py-2 rounded-s text-ui-small font-medium">
					Click Me
				</button>

				<div className="bg-background-modifier-error-rgb/10 text-text-error p-4 rounded-m text-ui-small">
					This is an error message using your custom colors
				</div>

				<div className="bg-background-modifier-success-rgb/10 text-text-success p-4 rounded-m text-ui-small">
					This is a success message using your custom colors
				</div>
			</main>
		</div>
	);
}
