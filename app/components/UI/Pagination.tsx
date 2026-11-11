import { IconButton, Button, Box } from "@mui/joy";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  disabled?: boolean;
  previousLabel?: string;
  nextLabel?: string;
}
export default function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  previousLabel,
  nextLabel,
}: PaginationProps) {
  if (totalPages < 1) return null;

  const generatePageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let prev;

    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    range.push(1);

    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    for (const i of range) {
      if (prev !== undefined) {
        if (i - prev === 2) {
          rangeWithDots.push(prev + 1);
        } else if (i - prev > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <Box
      display="flex"
      gap={1}
      justifyContent="center"
      alignItems="center"
      mt={2}
    >
      <IconButton
        type="button"
        size="sm"
        variant="outlined"
        aria-label={previousLabel}
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(Math.min(page - 1, totalPages))}
      >
        <ArrowBackIcon fontSize="small" />
      </IconButton>

      {pageNumbers.map((p, index) => (
        <Button
          type="button"
          key={index}
          variant={p === page ? "solid" : "outlined"}
          color="neutral"
          size="sm"
          aria-current={p === page ? "page" : undefined}
          disabled={disabled || p === "..."}
          onClick={() => typeof p === "number" && onPageChange(p)}
        >
          {p}
        </Button>
      ))}

      <IconButton
        type="button"
        size="sm"
        variant="outlined"
        aria-label={nextLabel}
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ArrowForwardIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
