// import CppExecutor from "../containers/CppExecutor";
import CppExecutor from "../containers/CppExecutor";
import JavaExecutor from "../containers/JavaExecutor";
import PythonExecutor from "../containers/PythonExecutor";
import CodeExecutorStrategy from "../types/codeExecutorStrategy";


export default function createExecutor(
    codeLanguage: string
): CodeExecutorStrategy | null {
    if (codeLanguage.toLowerCase() === "python") {
        return new PythonExecutor();
    } else if (codeLanguage.toLowerCase() === "c_cpp") {
        return new CppExecutor();
    }
    else if (codeLanguage.toLowerCase() === "java") {
        return new JavaExecutor();
    } else {
        return null;
    }
}
