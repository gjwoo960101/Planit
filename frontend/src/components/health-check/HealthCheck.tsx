import axios from "axios";
import type { HealthCheck } from "../../types/health-check";
import {useState } from "react";

const HealthCheck = () =>{
    const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
    const healthCheckApi = async () =>{
        const response  = await axios.get<HealthCheck>("/backend/health-check");
        setHealthCheck(response.data);
    }

    if(healthCheck){
        return (
            <div>
                <h1>Health Check</h1>
                <p>{healthCheck.status}</p>
                <button onClick={() => setHealthCheck(null)}>reset</button>
            </div>
        )
    }

    
    return (
        <div>
            <h1>Health</h1>
            <button onClick={() =>{healthCheckApi();}}>Check Health</button>
        </div>
    )
}

export default HealthCheck;