import CppExecutor from "../containers/CppExecutor";
import JavaExecutor from "../containers/JavaExecutor";
import PythonExecutor from "../containers/PythonExecutor";
import CodeExecutorStrategy from "../types/codeExecutorStrategy";

export default function createExecutor(
    codeLanguage: string
): CodeExecutorStrategy | null {
    if (codeLanguage.toLowerCase() === "python") {
        return new PythonExecutor();
    } else if (codeLanguage.toLowerCase() === "java") {
        return new JavaExecutor();
    } else if (codeLanguage.toLowerCase() === "cpp") {
        return new CppExecutor();
    } else {
        return null;
    }
}
