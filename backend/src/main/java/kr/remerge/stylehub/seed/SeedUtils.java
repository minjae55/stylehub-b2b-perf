package kr.remerge.stylehub.seed;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

public class SeedUtils {

    private SeedUtils() {
    }

    public static <T> T pick(List<T> list) {
        return list.get(ThreadLocalRandom.current().nextInt(list.size()));
    }
}
