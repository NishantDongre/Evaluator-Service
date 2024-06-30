import CppExecutor from "../containers/CppExector";
import JavaExecutor from "../containers/JavaExecutor";
import PythonExecutor from "../containers/PythonExecutor";
import CodeExecutorStrategy from "../types/codeExecutorStrategy";

export default function createExecutor(codeLanguage: string) : CodeExecutorStrategy | null {
    if(codeLanguage === "PYTHON") {
        return new PythonExecutor();
    } else if (codeLanguage === "JAVA"){
        return new JavaExecutor();
    } else if(codeLanguage === "CPP"){
        return new CppExecutor();
    } else {
        return null;
    }
}