"use client";

import styles from "./styles.module.scss";
import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <span className={styles.code}>404</span>
        <div className={styles.divider} />
        <span className={styles.text}>This page could not be found.</span>
      </div>

      <button className={styles.button} onClick={() => router.push("/")}>
        Quay về trang chủ
      </button>
    </div>
  );
}
