import { useEffect, useState } from "react"
import { socket } from "../utils/socket";
import { logged_user_id } from "../utils/loogen_user";

interface MessageProps {
    id: string,
    sender_id: number,
    receiver_id: number,
    message: string
}

const MessagesList = () => {
    const [messages, setMessages] = useState<MessageProps[]>([]);

    useEffect(()=> {
        setMessages(
            [
                {
                    id: "kk",
                    sender_id: 1,
                    receiver_id: 2,
                    message: "Hey How are you today?"
                },
                {
                    id: "oo",
                    sender_id: 1,
                    receiver_id: 2,
                    message: "I'm ok what about you?"
                }
            ]
        )
    }, []);

    useEffect(()=> {
        socket.on("chat message", (message: MessageProps)=> {
            console.log(message);
            setMessages((prevMsg)=> [...prevMsg, message])
        })
    }, []);

    return (
        <div className="flex flex-col h-full overflow-x-auto mb-4">
            <div className="flex flex-col h-full">
            <div className="grid grid-cols-12 gap-y-2">
                {
                    messages?.map((message)=> (
                        logged_user_id == message.sender_id
                             // SENDER'S MESSAGE
                            ? <div key={ message.id } className="col-start-1 col-end-8 p-3 rounded-lg">
                                    <div className="flex flex-row items-center">
                                        <div
                                        className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0"
                                        >
                                        A
                                        </div>
                                        <div
                                        className="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl"
                                        >
                                        <div>{ message?.message }</div>
                                        </div>
                                    </div>
                                </div>
                            //RECEIVER'S MESSAGE
                            :   <div key={ message.id } className="col-start-6 col-end-13 p-3 rounded-lg">
                                    <div className="flex items-center justify-start flex-row-reverse">
                                        <div
                                        className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0"
                                        >
                                        A
                                        </div>
                                        <div
                                        className="relative mr-3 text-sm bg-indigo-100 py-2 px-4 shadow rounded-xl"
                                        >
                                            <div>{ message?.message }</div>
                                        </div>
                                    </div>
                                </div>
                    ))
                }
            </div>
            </div>
        </div>
    )
}

export default MessagesList