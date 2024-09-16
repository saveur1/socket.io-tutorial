import { useEffect, useState } from "react"
import MessageForm from "./components/MessageForm"
import MessagesList from "./components/MessagesList"
import SideBar from "./components/SideBar"
import { socket } from "./utils/socket";

const App = () => {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [fooEvents, setFooEvents] = useState<string[]>([]);

    useEffect(() => {
        function onConnect() {
            console.log("Connected to server.")
            setIsConnected(true);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        function onFooEvent(value: string) {
            setFooEvents(previous => [...previous, value]);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('foo', onFooEvent);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('foo', onFooEvent);
        };
    }, []);
    return (
        <>
        <div className="flex h-screen antialiased text-gray-800">
                <div className="flex flex-row h-full w-full overflow-x-hidden">
                <SideBar />
                <div className="flex flex-col flex-auto h-full p-6">
                    <div
                    className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-gray-100 h-full p-4"
                    >
                    <MessagesList />
                    <MessageForm />
                    </div>
                </div>
                </div>
            </div>
        </>
    )
}

export default App