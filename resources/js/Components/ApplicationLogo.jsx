export default function ApplicationLogo(props) {
    return (
        <img
            src="/logo.svg"
            alt="Wevie"
            className={props.className || ""}
        />
    );
}
