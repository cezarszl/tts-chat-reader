import { exec } from 'child_process';

export const signalSend = (from: string, to: string, message: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const cmd = `/home/cezarszl/apps/signal-cli/signal-cli -a ${from} send -m "${message}" ${to}`;
        exec(cmd, (err, stdout, stderr) => {
            const output = (stdout + stderr).toString();
            if (err) {
                console.error('[Signal SEND error]', stderr);
                reject(output);
            } else {
                resolve(stdout.trim());
            }
        });
    });
};

export const signalReceive = (from: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const cmd = `signal-cli -a ${from} receive`;
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                console.error('[Signal RECEIVE error]', stderr);
                reject(stderr);
            } else {
                resolve(stdout.trim());
            }
        });
    });
};
