import './Spinner.css';
import { Loader } from "lucide-react";

type SpinnerProps = {
    size?: string;
}

const Spinner = ({ size = '28' }: SpinnerProps) => {
    return (
        <div className='w-full flex justify-center'>
            <Loader className={`animate-spin text-primary`} size={size} />
        </div>
    )
}

export default Spinner