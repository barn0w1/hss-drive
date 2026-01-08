import { UploadSession } from '@/features/upload/types';
import { FileText, Image as ImageIcon, Film, Music, File } from 'lucide-react';
import clsx from 'clsx';
import { useMemo } from 'react';

// Use same icon logic as main table for consistency
const getGhostIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return <ImageIcon className="w-5 h-5 text-gray-400" />;
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return <Film className="w-5 h-5 text-gray-400" />;
    if (['mp3', 'wav', 'ogg'].includes(ext)) return <Music className="w-5 h-5 text-gray-400" />;
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return <FileText className="w-5 h-5 text-gray-400" />;
    return <File className="w-5 h-5 text-gray-400" />;
};

export function UploadGhostRow({ session }: { session: UploadSession }) {
    
    // Status text
    const statusText = useMemo(() => {
        if (session.status === 'pending') return 'Queued';
        if (session.status === 'hashing') return 'Processing...';
        if (session.status === 'uploading') return 'Processing...';
        return 'Processing...';
    }, [session.status]);

    return (
        <tr className="h-[52px] bg-white border-b border-[#F9FAFB] opacity-60 animate-pulse">
            <td className="px-6 py-2">
                <div className="flex items-center gap-3 grayscale">
                    {getGhostIcon(session.file.name)}
                    <span className="font-medium text-sm truncate max-w-[300px] text-[#111827]">
                        {session.file.name}
                    </span>
                </div>
            </td>
            <td className="px-6 py-2">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[10px] font-bold text-[#6B7280]">
                            Me
                    </div>
                    <span className="text-sm text-[#6B7280]">Me</span>
                </div>
            </td>
            <td className="px-6 py-2 text-sm text-[#6B7280]">
                {statusText}
            </td>
            <td className="px-6 py-2 text-sm text-[#6B7280] text-right font-mono">
                ... 
            </td>
            <td className="px-6 py-2 text-right">
            </td>
        </tr>
    );
}
