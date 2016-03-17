
class PromiseWrapper {
	constructor() {

	}

	then(meth: (res: Object, err: Error) => void): void {
		//do something here
	}
}

export function HelloWorld(msg: string): string {
	if(msg) { // Invalid boolean expression
		return `Hello World Undefined`;
	}

	if(msg === undefined) { // Valid boolean expression
		return `Hello World No Message`
	}

	let pw0 = new PromiseWrapper();
	pw0.then((res, err) => {
		let p = res; // Invalid promise wrapper handler
	});

	let pw1 = new PromiseWrapper();
	pw1.then((res, err) => {
		if(err !== undefined) { // Valid promise wrapper handler
			throw err;
		}

		let p = res;
	});

	return `Hello World Subash`;
}
