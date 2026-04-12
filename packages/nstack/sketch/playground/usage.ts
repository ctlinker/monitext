import { interpretErrorStack } from "@/main";

try {
    throw new Error("Something went wrong");
} catch (err) {
    const stack = interpretErrorStack(err as Error);

    stack.forEach(line => {
        if (line.processed) {
            console.log(`- Backend: ${line.backend}`);
            console.log(`  Raw: ${line.raw}`);
            console.log(`  Path: ${line.resource}`);
            console.log(`  Line/Col: ${line.coord.line}:${line.coord.column}`);
        } else {
            console.warn(`- Unparsed line: ${line.raw}`);
        }
        console.log("")
    });
}