export interface PluginTestConfig {
    pluginPath: string;
    phpVersion: string;
    wordpressVersion: string;
    testCommand: string;
    setupScript?: string;
    usePrebuiltImage?: boolean;
}
export interface TestResult {
    success: boolean;
    output: string;
    error?: string;
}
export declare function runWordPressPluginTests(config: PluginTestConfig): Promise<TestResult>;
