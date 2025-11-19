type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

export default function Button(props: Props) {
  return (
    <button
      {...props}
      className={`border rounded px-3 py-2 cursor-pointer ${
        props.className || ""
      }`}
    >
      {props.children ? props.children : null}
    </button>
  );
}
