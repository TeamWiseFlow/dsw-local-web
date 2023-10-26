import styled from "styled-components";
import { Link } from "react-router-dom";
import Icons from "../components/Icons";

const Container = styled.div`
  overflow-y: scroll;

  & ul {
    list-style-type: none;
    margin: 0;
    padding: 20px 40px;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  & a {
    width: 170px;
    height: 170px;
    border-radius: 10px;
    user-select: none;
  }

  & a[disabled] {
    cursor: not-allowed;
    pointer-events: none;
  }

  & a:hover {
    transform: scale(1.01);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    // animate hover
    transition: transform 0.1s ease-in-out;
  }

  & svg {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    margin-bottom: 10px;
  }
`;

const IconLink = styled(Link)`
  background-color: ${(props) => props.color || "#ccc"};
  text-decoration: none;
  display: flex;
  flex-direction: column;
  padding: 15px;
`;
const IconTitle = styled.h2`
  color: #fff;
  font-size: 1.2rem;
  line-height: 1.2rem;
  margin: 0;
  margin-bottom: 5px;
`;

const IconDesc = styled.p`
  color: #fff;
`;

const Spacer = styled.div`
  flex: 1;
`;

const IconInfo = styled.p`
  color: white;
  font-size: 0.8rem;
`;

const Header = styled.div`
  padding: 20px 40px;
`;

const ICONS = [
  {
    to: "/tools/ba-old",
    disabled: false,
    color: "#89aeef",
    icon: Icons.Graph,
    title: "集采统计(旧版)",
    desc: "多文件汇总统计",
    version: "0.1.0",
    updated: "2023-8-15",
  },
  {
    to: "/tools/ba",
    disabled: false,
    color: "#65adef",
    icon: Icons.Graph,
    title: "集采统计",
    desc: "单文件汇总统计",
    version: "1.0.0",
    updated: "2023-10-15",
  },
  {
    to: "/tools/alert",
    disabled: false,
    color: "#78d48e",
    icon: Icons.Gear,
    title: "预算预警",
    desc: "",
    version: "预览",
    updated: "",
  },
  // {
  //   to: "/tools/compare",
  //   disabled: true,
  //   color: "#e48c56",
  //   icon: Icons.Gear,
  //   title: "预决算对比",
  //   desc: "",
  //   version: "未开发",
  //   updated: "",
  // },
];

export default function Tools() {
  return (
    <Container>
      <Header>
        <h1>所有工具</h1>
      </Header>
      <ul>
        {ICONS.map((ico) => (
          <li key={ico.title}>
            <IconLink to={ico.to} color={ico.color} disabled={ico.disabled}>
              <ico.icon></ico.icon>
              <IconTitle>{ico.title}</IconTitle>
              <IconDesc>{ico.desc}</IconDesc>
              <Spacer></Spacer>
              <IconInfo>{ico.version}</IconInfo>
              <IconInfo>{ico.updated}</IconInfo>
            </IconLink>
          </li>
        ))}
      </ul>
    </Container>
  );
}
