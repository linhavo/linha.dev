import happy from "./assets/happy.png";

function App() {
	return (
		<main className="flex justify-center items-center h-dvh">
			<div className="md:gap-10 flex-col md:flex-row flex gap-5 md:items-center items-start justify-between">
				<img src={happy} alt="" className="bg-primary rounded-full w-20 h-20" />
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-bold ">Vojta Linha</h1>
					<p>
						<a href="https://github.com/linhavo" className="hover:text-primary">
							Programátor
						</a>
						{", "}
						<a href="" className="hover:text-primary">
							designér
						</a>
						, a úsměvavý bojovník.
					</p>
				</div>
			</div>
		</main>
	);
}

export default App;
