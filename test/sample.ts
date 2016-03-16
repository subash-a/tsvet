
export function HelloWorld(msg: string): string {
	if(msg) { // Invalid boolean expression
		return `Hello World Undefined`;
	}

	if(msg === undefined) { // Valid boolean expression
		return `Hello World No Message`
	}

	return `Hello World Subash`;
}
