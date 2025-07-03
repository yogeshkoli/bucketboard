import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbNavProps {
    prefix: string;
    onNavigate: (path: string) => void;
}

export function BreadcrumbNav({ prefix, onNavigate }: BreadcrumbNavProps) {
    const segments = prefix.split('/').filter(Boolean);

    const handleNavigate = (index: number) => {
        const newPrefix = segments.slice(0, index + 1).join('/') + '/';
        onNavigate(newPrefix);
    };

    return (
        <nav className="flex items-center text-sm text-muted-foreground">
            <button onClick={() => onNavigate('')} className="flex items-center hover:text-primary">
                <Home className="h-4 w-4 mr-2" />
                {process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || 'your-bucket'}
            </button>
            {segments.map((segment, index) => (
                <div key={index} className="flex items-center">
                    <ChevronRight className="h-4 w-4 mx-1" />
                    {index < segments.length - 1 ? (
                        <button onClick={() => handleNavigate(index)} className="hover:text-primary">{segment}</button>
                    ) : (<span className="font-medium text-foreground">{segment}</span>)}
                </div>
            ))}
        </nav>
    );
}