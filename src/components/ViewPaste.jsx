// import React from 'react'
// import { useState } from 'react'
// import { useParams, useSearchParams } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { addToPastes, updateToPastes } from '../redux/pasteSlice';
// import { useEffect } from 'react';

// const ViewPaste = () => {
//     const { id } = useParams();
//     const allPastes = useSelector((state) => state.paste.pastes)
//     const paste = allPastes.filter((p) => p._id === id)[0];
//     return (

//         <div>
//             <div className="flex flex-row gap-7 place-content-between">
//                 <input
//                     className='p-1 rounded-2xl mt-2 w-[66%] pl-4'
//                     type="text"
//                     placeholder='Enter title'
//                     value={paste.title}
//                     disabled
//                     onChange={(e) => setTitle(e.target.value)}
//                 />

//             </div>
//             <div className="mt-8">
//                 <textarea
//                     className="rounded-2xl mt-4, min-w-[500px] p-4"
//                     value={paste.content}
//                     placeholder="Enter content here "
//                     onChange={(e) => setValue(e.target.value)}
//                     disabled
//                     rows={20}
//                     cols={20}

//                 />

//             </div>
//         </div>
//     )


// }

// export default ViewPaste


import { Copy } from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

const ViewPaste = () => {
    const { id } = useParams();

    console.log(id)

    const pastes = useSelector((state) => state.paste.pastes);

    // Filter pastes based on search term (by title or content)
    const paste = pastes.filter((paste) => paste._id === id)[0];

    console.log("Paste->", paste);
    return (
        <div className="w-full h-full py-10 max-w-[1200px] mx-auto px-5 lg:px-0">
            <div className="flex flex-col gap-y-5 items-start">
                <input
                    type="text"
                    placeholder="Title"
                    value={paste.title}
                    disabled
                    className="w-full text-black border border-input rounded-md p-2"
                />
                <div
                    className={`w-full flex flex-col items-start relative rounded bg-opacity-10 border border-[rgba(128,121,121,0.3)] backdrop-blur-2xl`}
                >
                    <div
                        className={`w-full rounded-t flex items-center justify-between gap-x-4 px-4 py-2 border-b border-[rgba(128,121,121,0.3)]`}
                    >
                        <div className="w-full flex gap-x-[6px] items-center select-none group">
                            <div className="w-[13px] h-[13px] rounded-full flex items-center justify-center p-[1px] overflow-hidden bg-[rgb(255,95,87)]" />

                            <div
                                className={`w-[13px] h-[13px] rounded-full flex items-center justify-center p-[1px] overflow-hidden bg-[rgb(254,188,46)]`}
                            />

                            <div className="w-[13px] h-[13px] rounded-full flex items-center justify-center p-[1px] overflow-hidden bg-[rgb(45,200,66)]" />
                        </div>
                        {/* Circle and copy btn */}
                        <div
                            className={`w-fit rounded-t flex items-center justify-between gap-x-4 px-4`}
                        >
                            {/*Copy  button */}
                            <button
                                className={`flex justify-center items-center  transition-all duration-300 ease-in-out group`}
                                onClick={() => {
                                    navigator.clipboard.writeText(paste.content);
                                    toast.success("Copied to Clipboard");
                                }}
                            >
                                <Copy className="group-hover:text-sucess-500" size={20} />
                            </button>
                        </div>
                    </div>

                    {/* TextArea */}
                    <textarea
                        value={paste.content}
                        disabled
                        placeholder="Write Your Content Here...."
                        className="w-full p-3  focus-visible:ring-0"
                        style={{
                            caretColor: "#000",
                        }}
                        rows={20}
                    />
                </div>
            </div>
        </div>
    );
};

export default ViewPaste;
