import styled from 'styled-components'
import { Link } from 'react-router-dom'

export default function Tools() {

    return (
        <div>
            <h1>所有工具</h1>

            <ul>
                <li><Link to={`/tools/sum`}>集采统计</Link></li>
                <li><Link disabled>预算预警</Link></li>
                <li><Link disabled>预决算对比</Link></li>
            </ul>
        </div>
    )
}