export type Env = {
    user?: string;
    ssh_key?: string;
    python?: string;
    become?: boolean;
};
export type HostEntry = { addr: string; env?: Env };
export type Step = {
    name: string;
    command?: string;
    become?: boolean;
    stdin?: string;
    msg?: string;
    loop?: string;
};
export type RunbookToml = {
    name: string;
    description?: string;
    debug?: boolean;
    hosts: HostEntry[];
    env: Env;
    steps: Step[];
};