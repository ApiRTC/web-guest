import FormControlLabel from "@mui/material/FormControlLabel/FormControlLabel";
import Link from "@mui/material/Link/Link";
import Switch from "@mui/material/Switch/Switch";
import Typography from "@mui/material/Typography/Typography";
import React from "react";

export type OptInProps = {
  checked: boolean;
  id: string;
  labels: {
    aria: string;
    prefix: string;
    link: string;
  };
  link: string;
  onChange: (id: string) => void;
};

const OptIn: React.FC<OptInProps> = ({
  id,
  checked,
  labels,
  link,
  onChange,
}: OptInProps) => {
  return (
    <FormControlLabel
      required
      control={
        <Switch
          id={`${id}`}
          data-testid={`${id}`}
          checked={checked}
          onChange={() => onChange(id)}
          inputProps={{ "aria-label": labels.aria }}
        />
      }
      label={
        <Typography variant="body1" component="span">
          {labels.prefix}
          <Link target="_blank" href={link}>{labels.link}</Link>
        </Typography>
      }
    />
  );
};

export default OptIn;
